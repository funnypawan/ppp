package com.focuslock.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A user-defined daily limit for one installed app.
 * Every app can have a completely independent limit.
 */
@Entity(tableName = "app_limits")
data class AppLimitEntity(
    @PrimaryKey val packageName: String,
    /** Daily allowance in whole minutes. */
    val dailyLimitMinutes: Int,
    /** Master on/off for this app's limit (limit value is kept when off). */
    val enabled: Boolean = true,
    /** Essential apps (phone, banking, …) can be exempt: measured, never blocked. */
    val exempt: Boolean = false,
    val updatedAtMillis: Long = System.currentTimeMillis()
)

/**
 * FocusLock's own per-day bookkeeping for one app.
 *
 * The authoritative usage numbers always come from Android's
 * UsageStatsManager; this table stores what the system cannot tell us:
 * blocked attempts, emergency time, the "reset today's counter" offset and
 * daily snapshots for history. Rows are keyed by local calendar date, which
 * is what makes the daily reset reliable (no midnight alarm required).
 */
@Entity(tableName = "daily_usage", primaryKeys = ["packageName", "date"])
data class DailyUsageEntity(
    val packageName: String,
    /** Local calendar date, yyyy-MM-dd. */
    val date: String,
    /** Last snapshot of system-reported usage for this date (statistics). */
    val usageMillis: Long = 0L,
    /**
     * Baseline subtracted from system usage when the user chooses
     * "Reset today's counted usage". Editing a limit never touches this.
     */
    val usageOffsetMillis: Long = 0L,
    /** Times FocusLock had to block this app today (only ever counted by us). */
    val blockedAttempts: Int = 0,
    /** Milliseconds of emergency-session time spent inside this app today. */
    val emergencyMillisUsed: Long = 0L,
    /** When the app was first blocked today (0 = never). For "time protected". */
    val firstBlockedAtMillis: Long = 0L
)

/**
 * Emergency Access state for one calendar day.
 *
 * Invariants enforced by [com.focuslock.app.domain.EmergencyManager]:
 *  - at most 3 sessions per date,
 *  - each session ends exactly 10 minutes after it starts,
 *  - at most one active session at a time (for the whole device),
 *  - start/end are wall-clock timestamps, so a reboot or app restart
 *    restores the *same* remaining time instead of resetting it.
 */
@Entity(tableName = "emergency_state")
data class EmergencyStateEntity(
    @PrimaryKey val date: String,
    val sessionsUsed: Int = 0,
    /** Package of the currently active session, or null when none is active. */
    val activePackage: String? = null,
    val activeStartWallMillis: Long = 0L,
    val activeEndWallMillis: Long = 0L,
    /** Total emergency milliseconds consumed on this date (statistics). */
    val totalEmergencyMillis: Long = 0L
)
