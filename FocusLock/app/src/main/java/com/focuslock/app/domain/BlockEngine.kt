package com.focuslock.app.domain

import com.focuslock.app.data.AppLimitEntity

/**
 * Pure decision logic for app blocking. Kept Android-free so every rule can
 * be verified by fast JVM unit tests.
 *
 * An app is blocked only when ALL of these are true:
 *  - it is not a system-exempt package (launcher, dialer, System UI,
 *    FocusLock itself, emergency/essential system components),
 *  - the global protection switch is on,
 *  - the current time is inside the protection schedule,
 *  - no break (manual or scheduled) is active,
 *  - the app has a limit that is enabled and not marked exempt,
 *  - no emergency session is currently running for this app,
 *  - today's usage has reached the limit.
 */
object BlockEngine {

    data class Input(
        val packageName: String,
        val usageTodayMillis: Long,
        val limit: AppLimitEntity?,
        val protectionEnabled: Boolean,
        val emergencyActiveForPackage: Boolean,
        val withinSchedule: Boolean,
        val breakActive: Boolean,
        val systemExempt: Boolean
    )

    fun shouldBlock(input: Input): Boolean {
        if (input.systemExempt) return false
        if (!input.protectionEnabled) return false
        if (!input.withinSchedule) return false
        if (input.breakActive) return false
        val limit = input.limit ?: return false
        if (!limit.enabled || limit.exempt) return false
        if (input.emergencyActiveForPackage) return false
        return input.usageTodayMillis >= limitMillis(limit.dailyLimitMinutes)
    }

    fun limitMillis(limitMinutes: Int): Long = limitMinutes * 60_000L

    /**
     * Remaining allowance when [limitMinutes] is applied to usage that has
     * already been consumed. Editing a limit uses this directly, e.g.
     * used 25m, limit raised 30m -> 60m  ⇒  remaining = 35m.
     * A limit lowered below current usage yields 0 (block immediately).
     */
    fun remainingMillis(usageTodayMillis: Long, limitMinutes: Int): Long =
        (limitMillis(limitMinutes) - usageTodayMillis).coerceAtLeast(0L)

    /** Limit-state check that ignores schedule/break (for lists & badges). */
    fun isOverLimit(usageTodayMillis: Long, limit: AppLimitEntity?): Boolean {
        if (limit == null || !limit.enabled || limit.exempt) return false
        return usageTodayMillis >= limitMillis(limit.dailyLimitMinutes)
    }
}
