package com.focuslock.app.domain

import com.focuslock.app.data.DailyUsageDao
import com.focuslock.app.data.EmergencyDao
import com.focuslock.app.data.EmergencyStateEntity
import com.focuslock.app.util.TimeUtils
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Emergency Access: exactly **3 sessions per local calendar day**, each
 * lasting exactly **10 minutes** (30 minutes maximum per day).
 *
 * Reliability design:
 *  - State is persisted in Room, keyed by local date (yyyy-MM-dd). A new
 *    calendar day automatically means a fresh allowance of 3 sessions —
 *    no midnight alarm has to fire.
 *  - A session stores its wall-clock start and end timestamps
 *    (`end = start + 10 minutes`). Remaining time is always derived as
 *    `end - now`, so force-closing FocusLock, killing the process or
 *    rebooting the phone can never extend or reset a session.
 *  - Leaving the blocked app does not pause the countdown: the session
 *    belongs to the clock, not to the app's foreground time.
 *  - All mutations run under a [Mutex] and "already active" is checked
 *    before counting a new session, so double-taps cannot consume two
 *    sessions or start parallel sessions.
 *  - Only one session can be active at a time, for one single app.
 *  - Sessions never modify the app's daily limit.
 *
 * The clock is injectable so the full behaviour (including "reboot during
 * a session" and "midnight reset") is covered by plain JVM unit tests.
 */
class EmergencyManager(
    private val emergencyDao: EmergencyDao,
    private val dailyUsageDao: DailyUsageDao,
    private val clock: () -> Long = { System.currentTimeMillis() }
) {

    sealed interface StartResult {
        /** A new session was started; it ends at [endsAtMillis] (wall clock). */
        data class Started(val packageName: String, val endsAtMillis: Long) : StartResult
        /** A session is already running (double-tap / other app). Nothing consumed. */
        data class AlreadyActive(val packageName: String, val remainingMillis: Long) : StartResult
        /** All 3 sessions for today have been used. */
        data object NoSessionsLeft : StartResult
    }

    data class Status(
        val sessionsUsedToday: Int,
        val sessionsRemaining: Int,
        /** Package of the running session, or null. */
        val activePackage: String?,
        val activeRemainingMillis: Long,
        val activeEndsAtMillis: Long,
        /** Completed + currently-elapsed emergency time for today. */
        val totalEmergencyMillisToday: Long
    )

    private val mutex = Mutex()

    suspend fun status(): Status = mutex.withLock {
        val now = clock()
        expireIfNeededLocked(now)
        val today = todayStateLocked(now)
        val active = activeStateLocked(now)

        // Elapsed part of the running session that falls inside today
        // (relevant when a session started just before midnight).
        val activeElapsedToday = if (active != null) {
            val from = maxOf(active.activeStartWallMillis, TimeUtils.startOfDay(now))
            (minOf(now, active.activeEndWallMillis) - from).coerceAtLeast(0L)
        } else 0L

        Status(
            sessionsUsedToday = today.sessionsUsed,
            sessionsRemaining =
                (MAX_SESSIONS_PER_DAY - today.sessionsUsed).coerceIn(0, MAX_SESSIONS_PER_DAY),
            activePackage = active?.activePackage,
            activeRemainingMillis =
                active?.let { (it.activeEndWallMillis - now).coerceAtLeast(0L) } ?: 0L,
            activeEndsAtMillis = active?.activeEndWallMillis ?: 0L,
            totalEmergencyMillisToday = today.totalEmergencyMillis + activeElapsedToday
        )
    }

    /**
     * Starts a 10-minute session for [packageName] if the rules allow it.
     * Must be triggered by an explicit user action (button + confirmation).
     */
    suspend fun startSession(packageName: String): StartResult = mutex.withLock {
        val now = clock()
        expireIfNeededLocked(now)

        // Rule: a single active session at a time. This also makes the
        // operation idempotent against accidental double-taps.
        activeStateLocked(now)?.let { active ->
            return@withLock StartResult.AlreadyActive(
                packageName = active.activePackage ?: packageName,
                remainingMillis = (active.activeEndWallMillis - now).coerceAtLeast(0L)
            )
        }

        val today = todayStateLocked(now)
        if (today.sessionsUsed >= MAX_SESSIONS_PER_DAY) {
            return@withLock StartResult.NoSessionsLeft
        }

        val endsAt = now + SESSION_DURATION_MS
        emergencyDao.upsert(
            today.copy(
                sessionsUsed = today.sessionsUsed + 1,
                activePackage = packageName,
                activeStartWallMillis = now,
                activeEndWallMillis = endsAt
            )
        )
        StartResult.Started(packageName, endsAt)
    }

    /**
     * If the active session's end time has passed, finalises it (records the
     * consumed time for statistics) and returns its package; otherwise null.
     * Called on every protection tick and whenever the UI refreshes, so
     * blocking is restored promptly even if no timer ever fired.
     */
    suspend fun expireIfNeeded(): String? = mutex.withLock {
        expireIfNeededLocked(clock())
    }

    suspend fun isSessionActiveFor(packageName: String): Boolean {
        val status = status()
        return status.activePackage == packageName && status.activeRemainingMillis > 0L
    }

    private suspend fun expireIfNeededLocked(now: Long): String? {
        val row = emergencyDao.getActiveRow() ?: return null
        val pkg = row.activePackage ?: return null
        if (now < row.activeEndWallMillis) return null

        // Consumed time can never exceed the fixed 10-minute session length,
        // even if the device clock was moved while the session ran.
        val consumed = (row.activeEndWallMillis - row.activeStartWallMillis)
            .coerceIn(0L, SESSION_DURATION_MS)

        emergencyDao.upsert(
            row.copy(
                activePackage = null,
                activeStartWallMillis = 0L,
                activeEndWallMillis = 0L,
                totalEmergencyMillis = row.totalEmergencyMillis + consumed
            )
        )
        dailyUsageDao.addEmergencyMillis(pkg, row.date, consumed)
        return pkg
    }

    private suspend fun todayStateLocked(now: Long): EmergencyStateEntity {
        val key = TimeUtils.dateKey(now)
        return emergencyDao.getForDate(key)
            ?: EmergencyStateEntity(date = key).also { emergencyDao.upsert(it) }
    }

    private suspend fun activeStateLocked(now: Long): EmergencyStateEntity? {
        val row = emergencyDao.getActiveRow() ?: return null
        return if (row.activePackage != null && now < row.activeEndWallMillis) row else null
    }

    companion object {
        const val MAX_SESSIONS_PER_DAY = 3
        const val SESSION_DURATION_MS = 10L * 60L * 1000L // exactly 10 minutes
    }
}
