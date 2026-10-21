package com.focuslock.app

import com.focuslock.app.data.DailyUsageDao
import com.focuslock.app.data.DailyUsageEntity
import com.focuslock.app.data.EmergencyDao
import com.focuslock.app.data.EmergencyStateEntity
import com.focuslock.app.domain.EmergencyManager
import com.focuslock.app.util.TimeUtils
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Emergency Access rules (requirements §5):
 * 3 sessions/day × exactly 10 minutes, single active session, persistent
 * across restarts, reset at local midnight, no double-tap consumption.
 *
 * The manager takes an injectable clock, so "reboot during a session" and
 * "midnight reset" are tested by moving the fake clock, not by waiting.
 */
class EmergencyManagerTest {

    private var now: Long = 0L
    private lateinit var emergencyDao: FakeEmergencyDao
    private lateinit var dailyUsageDao: FakeDailyUsageDao
    private lateinit var manager: EmergencyManager

    @Before
    fun setUp() {
        // 10:00 local time today — safely away from midnight boundaries.
        now = TimeUtils.startOfDay(System.currentTimeMillis()) + 10L * 3600_000L
        emergencyDao = FakeEmergencyDao()
        dailyUsageDao = FakeDailyUsageDao()
        manager = newManager()
    }

    private fun newManager() = EmergencyManager(emergencyDao, dailyUsageDao) { now }

    @Test
    fun `a session lasts exactly 10 minutes`() = runBlocking {
        val result = manager.startSession("com.example.app")
        assertTrue(result is EmergencyManager.StartResult.Started)
        assertEquals(
            now + EmergencyManager.SESSION_DURATION_MS,
            (result as EmergencyManager.StartResult.Started).endsAtMillis
        )

        now += 599_000L // 09:59 elapsed
        assertTrue(manager.isSessionActiveFor("com.example.app"))
        assertEquals(1_000L, manager.status().activeRemainingMillis)

        now += 1_000L // exactly 10:00 elapsed
        assertEquals("com.example.app", manager.expireIfNeeded())
        assertFalse(manager.isSessionActiveFor("com.example.app"))
    }

    @Test
    fun `the fourth session in a day is denied`() = runBlocking {
        repeat(3) {
            assertTrue(manager.startSession("com.example.app") is EmergencyManager.StartResult.Started)
            now += EmergencyManager.SESSION_DURATION_MS + 1_000L
            manager.expireIfNeeded()
        }
        assertEquals(0, manager.status().sessionsRemaining)
        assertEquals(
            EmergencyManager.StartResult.NoSessionsLeft,
            manager.startSession("com.example.app")
        )
    }

    @Test
    fun `double tap does not consume a second session`() = runBlocking {
        manager.startSession("com.example.app")
        val second = manager.startSession("com.example.app")
        assertTrue(second is EmergencyManager.StartResult.AlreadyActive)
        assertEquals(2, manager.status().sessionsRemaining)
    }

    @Test
    fun `only one active session at a time, for one app`() = runBlocking {
        manager.startSession("com.example.a")
        val result = manager.startSession("com.example.b")
        assertTrue(result is EmergencyManager.StartResult.AlreadyActive)
        assertEquals(
            "com.example.a",
            (result as EmergencyManager.StartResult.AlreadyActive).packageName
        )
        assertFalse(manager.isSessionActiveFor("com.example.b"))
    }

    @Test
    fun `remaining time and count survive a restart (reboot)`() = runBlocking {
        manager.startSession("com.example.app")
        now += 3L * 60_000L // phone off / process dead for 3 minutes

        // A brand-new manager over the same stored state = app restart/reboot.
        val afterRestart = newManager()
        val status = afterRestart.status()
        assertEquals("com.example.app", status.activePackage)
        assertEquals(7L * 60_000L, status.activeRemainingMillis)
        assertEquals(2, status.sessionsRemaining)
    }

    @Test
    fun `countdown follows the wall clock, not app usage`() = runBlocking {
        manager.startSession("com.example.app")
        // User leaves the app; FocusLock does nothing but time passes.
        now += 4L * 60_000L
        assertEquals(6L * 60_000L, manager.status().activeRemainingMillis)
    }

    @Test
    fun `sessions reset on the next calendar day`() = runBlocking {
        repeat(3) {
            manager.startSession("com.example.app")
            now += EmergencyManager.SESSION_DURATION_MS + 1_000L
            manager.expireIfNeeded()
        }
        assertEquals(0, manager.status().sessionsRemaining)

        now = TimeUtils.nextMidnight(now) + 60_000L // 00:01 next day
        assertEquals(3, manager.status().sessionsRemaining)
        assertTrue(manager.startSession("com.example.app") is EmergencyManager.StartResult.Started)
    }

    @Test
    fun `consumed emergency time is recorded for statistics`() = runBlocking {
        val startDate = TimeUtils.dateKey(now)
        manager.startSession("com.example.app")
        now += EmergencyManager.SESSION_DURATION_MS
        manager.expireIfNeeded()

        val row = dailyUsageDao.getForPackageDate("com.example.app", startDate)
        assertEquals(600_000L, row?.emergencyMillisUsed)
        assertEquals(600_000L, manager.status().totalEmergencyMillisToday)
    }

    @Test
    fun `session crossing midnight keeps its remaining time`() = runBlocking {
        // Start at 23:57 — session ends 00:07 next day.
        now = TimeUtils.startOfDay(now) + 23L * 3600_000L + 57L * 60_000L
        manager = newManager()
        manager.startSession("com.example.app")

        now += 5L * 60_000L // 00:02
        val status = manager.status()
        assertEquals("com.example.app", status.activePackage)
        assertEquals(5L * 60_000L, status.activeRemainingMillis)
        assertEquals(3, status.sessionsRemaining) // new day's fresh allowance

        // But the still-running session blocks a parallel one.
        assertTrue(manager.startSession("com.example.other") is EmergencyManager.StartResult.AlreadyActive)

        now += 5L * 60_000L // 00:07 — session ends
        assertEquals("com.example.app", manager.expireIfNeeded())
        assertTrue(manager.startSession("com.example.other") is EmergencyManager.StartResult.Started)
        assertEquals(2, manager.status().sessionsRemaining)
    }

    // ------------------------------------------------------------ fakes

    private class FakeEmergencyDao : EmergencyDao {
        val rows = mutableMapOf<String, EmergencyStateEntity>()

        override suspend fun getForDate(date: String): EmergencyStateEntity? = rows[date]

        override fun observeForDate(date: String): Flow<EmergencyStateEntity?> =
            flowOf(rows[date])

        override suspend fun getLatest(): EmergencyStateEntity? =
            rows.values.maxByOrNull { it.date }

        override suspend fun getActiveRow(): EmergencyStateEntity? =
            rows.values.filter { it.activePackage != null }.maxByOrNull { it.date }

        override suspend fun upsert(state: EmergencyStateEntity) {
            rows[state.date] = state
        }

        override suspend fun deleteOlderThan(beforeDate: String) {
            rows.keys.removeAll { it < beforeDate }
        }
    }

    private class FakeDailyUsageDao : DailyUsageDao {
        val rows = mutableMapOf<Pair<String, String>, DailyUsageEntity>()

        override suspend fun getForDate(date: String): List<DailyUsageEntity> =
            rows.values.filter { it.date == date }

        override suspend fun getForPackageDate(
            pkg: String,
            date: String
        ): DailyUsageEntity? = rows[pkg to date]

        override suspend fun getRange(
            fromDate: String,
            toDate: String
        ): List<DailyUsageEntity> = rows.values.filter { it.date in fromDate..toDate }

        override suspend fun upsert(row: DailyUsageEntity) {
            rows[row.packageName to row.date] = row
        }

        override suspend fun deleteOlderThan(beforeDate: String) {
            rows.keys.removeAll { it.second < beforeDate }
        }
        // addEmergencyMillis / incrementBlockedAttempts / … are interface
        // default methods and are inherited (they run on top of the fakes).
    }
}
