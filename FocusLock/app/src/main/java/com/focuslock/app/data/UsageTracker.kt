package com.focuslock.app.data

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import com.focuslock.app.util.TimeUtils

/**
 * Reads per-app usage from Android's [UsageStatsManager].
 *
 * Two measurement strategies are used:
 *
 * 1. **Event-based** ([foregroundTimeByEvents]) — pairs ACTIVITY_RESUMED /
 *    ACTIVITY_PAUSED events. This is the accurate method and is used for
 *    "today" (i.e. for every blocking decision) and short ranges.
 *
 * 2. **Bucket-based** ([foregroundTimeByStats]) — sums
 *    `totalTimeInForeground` from daily buckets. Used for 30-day history,
 *    where raw events may no longer be retained by the system.
 *
 * All methods return an empty map instead of throwing when Usage Access
 * has not been granted.
 */
class UsageTracker(context: Context) {

    private val usm: UsageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    /**
     * Foreground milliseconds per package inside [beginMillis, endMillis].
     *
     * A short look-back window is queried so an app that was already open at
     * [beginMillis] (e.g. across midnight) is still measured correctly:
     * intervals are clamped to start at [beginMillis].
     */
    fun foregroundTimeByEvents(beginMillis: Long, endMillis: Long): Map<String, Long> {
        if (endMillis <= beginMillis) return emptyMap()
        val totals = HashMap<String, Long>()
        // Keyed by "package/class" because one package can host several
        // activities whose resume/pause events interleave.
        val openSince = HashMap<String, Long>()
        try {
            val events = usm.queryEvents(beginMillis - LOOKBACK_MS, endMillis) ?: return emptyMap()
            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val pkg = event.packageName ?: continue
                val key = pkg + "/" + (event.className ?: "")
                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        // Clamp sessions that started before the window.
                        openSince[key] = maxOf(event.timeStamp, beginMillis)
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED -> {
                        val start = openSince.remove(key)
                        if (start != null && event.timeStamp > start) {
                            totals[pkg] = (totals[pkg] ?: 0L) + (event.timeStamp - start)
                        }
                    }
                }
            }
            // Activities still in the foreground at endMillis.
            for ((key, start) in openSince) {
                if (endMillis > start) {
                    val pkg = key.substringBefore('/')
                    totals[pkg] = (totals[pkg] ?: 0L) + (endMillis - start)
                }
            }
        } catch (e: Exception) {
            // Usage Access revoked mid-query, OEM quirks, etc. — treat as no data.
            return emptyMap()
        }
        return totals
    }

    /** Bucket-based totals; best for long historical ranges. */
    fun foregroundTimeByStats(beginMillis: Long, endMillis: Long): Map<String, Long> {
        if (endMillis <= beginMillis) return emptyMap()
        val totals = HashMap<String, Long>()
        try {
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, beginMillis, endMillis
            ) ?: return emptyMap()
            for (s in stats) {
                if (s.totalTimeInForeground > 0L) {
                    totals[s.packageName] =
                        (totals[s.packageName] ?: 0L) + s.totalTimeInForeground
                }
            }
        } catch (e: Exception) {
            return emptyMap()
        }
        return totals
    }

    /** Accurate "today since local midnight" usage map. */
    fun usageSinceStartOfToday(now: Long = System.currentTimeMillis()): Map<String, Long> =
        foregroundTimeByEvents(TimeUtils.startOfDay(now), now)

    fun usageForPackageToday(packageName: String, now: Long = System.currentTimeMillis()): Long =
        usageSinceStartOfToday(now)[packageName] ?: 0L

    /** Cheap probe used to double-check the Usage Access app-op on quirky OEMs. */
    fun hasAnyData(): Boolean {
        val now = System.currentTimeMillis()
        return try {
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, now - DAY_MS, now
            )
            !stats.isNullOrEmpty()
        } catch (e: Exception) {
            false
        }
    }

    companion object {
        private const val LOOKBACK_MS = 30L * 60L * 1000L // 30 minutes
        private const val DAY_MS = 24L * 60L * 60L * 1000L
    }
}

/**
 * Tracks which package(s) are currently resumed (foreground) using usage
 * events, without re-scanning hours of history on every poll.
 *
 * The first [refresh] scans a 2-hour window; later refreshes only process
 * events since the previous scan (plus a small overlap, which is harmless
 * because events are replayed in chronological order). This keeps the
 * monitor service cheap while still detecting an app that has been in the
 * foreground for a long time — exactly the case where a limit is reached
 * mid-session.
 */
class ForegroundTracker(context: Context) {

    private val usm: UsageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    private var lastCheckMillis: Long = 0L
    /** package -> timestamp of its latest ACTIVITY_RESUMED, for resumed apps only. */
    private val resumedAt = HashMap<String, Long>()
    private var mostRecentPackage: String? = null

    @Synchronized
    fun refresh(now: Long = System.currentTimeMillis()): String? {
        val from = if (lastCheckMillis == 0L) {
            now - INITIAL_WINDOW_MS
        } else {
            lastCheckMillis - OVERLAP_MS
        }
        try {
            val events = usm.queryEvents(from, now)
            if (events != null) {
                val event = UsageEvents.Event()
                while (events.hasNextEvent()) {
                    events.getNextEvent(event)
                    val pkg = event.packageName ?: continue
                    when (event.eventType) {
                        UsageEvents.Event.ACTIVITY_RESUMED -> {
                            resumedAt[pkg] = event.timeStamp
                            mostRecentPackage = pkg
                        }
                        UsageEvents.Event.ACTIVITY_PAUSED -> {
                            val resumed = resumedAt[pkg]
                            if (resumed != null && resumed <= event.timeStamp) {
                                resumedAt.remove(pkg)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // No Usage Access: keep last known state rather than crashing.
        }
        lastCheckMillis = now
        if (mostRecentPackage != null && !resumedAt.containsKey(mostRecentPackage)) {
            mostRecentPackage = resumedAt.maxByOrNull { it.value }?.key
        }
        return mostRecentPackage
    }

    /** All packages currently resumed (more than one in split-screen). */
    @Synchronized
    fun resumedPackages(): Set<String> = resumedAt.keys.toSet()

    @Synchronized
    fun current(): String? = mostRecentPackage

    companion object {
        private const val INITIAL_WINDOW_MS = 2L * 60L * 60L * 1000L // 2 hours
        private const val OVERLAP_MS = 3_000L
    }
}
