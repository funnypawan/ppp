package com.focuslock.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.focuslock.app.util.TimeUtils
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.focusLockDataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/**
 * All user settings in one immutable snapshot.
 *
 * Schedules and breaks are stored as "minutes of day" (0..1439) and are
 * always evaluated against the current local time, so they keep working
 * across reboots and timezone changes without any alarms.
 */
data class SettingsState(
    val protectionEnabled: Boolean = true,
    val onboardingCompleted: Boolean = false,

    // Protection schedule: limits are only enforced inside this window.
    val scheduleEnabled: Boolean = false,
    val scheduleStartMinutes: Int = 8 * 60,
    val scheduleEndMinutes: Int = 22 * 60,

    // Break mode (manual): blocking paused until this wall-clock time.
    val breakUntilMillis: Long = 0L,

    // Break mode (scheduled every day).
    val scheduledBreakEnabled: Boolean = false,
    val scheduledBreakStartMinutes: Int = 13 * 60,
    val scheduledBreakDurationMinutes: Int = 30,

    // Strict mode.
    val strictModeEnabled: Boolean = false,
    val editCooldownMinutes: Int = 0,
    /** Strict-mode cooldown: editing unlocks at this time. */
    val cooldownEndsAtMillis: Long = 0L,
    /** After a successful cooldown+PIN, editing stays unlocked until this time. */
    val editUnlockUntilMillis: Long = 0L,

    val themeMode: Int = THEME_SYSTEM,

    /** Remembers accessibility was on once, so revocation can be detected. */
    val accessibilityWasEnabled: Boolean = false
) {
    /** True when limit enforcement is allowed at [nowMillis]. */
    fun isWithinSchedule(nowMillis: Long): Boolean {
        if (!scheduleEnabled) return true
        val nowMin = TimeUtils.minutesOfDay(nowMillis)
        return if (scheduleStartMinutes <= scheduleEndMinutes) {
            nowMin >= scheduleStartMinutes && nowMin < scheduleEndMinutes
        } else {
            // Overnight window, e.g. 21:00 -> 06:00
            nowMin >= scheduleStartMinutes || nowMin < scheduleEndMinutes
        }
    }

    /** True during a manual or scheduled break. Breaks never reset usage. */
    fun isBreakActive(nowMillis: Long): Boolean {
        if (nowMillis < breakUntilMillis) return true
        if (!scheduledBreakEnabled) return false
        val nowMin = TimeUtils.minutesOfDay(nowMillis)
        val sinceStart = (nowMin - scheduledBreakStartMinutes + 24 * 60) % (24 * 60)
        return sinceStart < scheduledBreakDurationMinutes
    }

    /** Wall-clock end of the current break, or 0 when no break is active. */
    fun breakEndsAt(nowMillis: Long): Long {
        if (nowMillis < breakUntilMillis) return breakUntilMillis
        if (!isBreakActive(nowMillis)) return 0L
        // Scheduled break: minutes remaining in today's window.
        val nowMin = TimeUtils.minutesOfDay(nowMillis)
        val sinceStart = (nowMin - scheduledBreakStartMinutes + 24 * 60) % (24 * 60)
        val remainingMinutes = (scheduledBreakDurationMinutes - sinceStart).coerceAtLeast(0)
        val startOfMinute = nowMillis - (nowMillis % 60_000L)
        return startOfMinute + remainingMinutes * 60_000L
    }

    companion object {
        const val THEME_SYSTEM = 0
        const val THEME_LIGHT = 1
        const val THEME_DARK = 2
    }
}

class SettingsStore(private val context: Context) {

    private object Keys {
        val PROTECTION_ENABLED = booleanPreferencesKey("protection_enabled")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        val SCHEDULE_ENABLED = booleanPreferencesKey("schedule_enabled")
        val SCHEDULE_START = intPreferencesKey("schedule_start_minutes")
        val SCHEDULE_END = intPreferencesKey("schedule_end_minutes")
        val BREAK_UNTIL = longPreferencesKey("break_until_millis")
        val SCHED_BREAK_ENABLED = booleanPreferencesKey("scheduled_break_enabled")
        val SCHED_BREAK_START = intPreferencesKey("scheduled_break_start_minutes")
        val SCHED_BREAK_DURATION = intPreferencesKey("scheduled_break_duration_minutes")
        val STRICT_ENABLED = booleanPreferencesKey("strict_mode_enabled")
        val EDIT_COOLDOWN_MINUTES = intPreferencesKey("edit_cooldown_minutes")
        val COOLDOWN_ENDS_AT = longPreferencesKey("cooldown_ends_at_millis")
        val EDIT_UNLOCK_UNTIL = longPreferencesKey("edit_unlock_until_millis")
        val THEME_MODE = intPreferencesKey("theme_mode")
        val ACCESSIBILITY_WAS_ENABLED = booleanPreferencesKey("accessibility_was_enabled")
    }

    private val store get() = context.focusLockDataStore

    val flow: Flow<SettingsState> = store.data
        .map { prefs ->
            SettingsState(
                protectionEnabled = prefs[Keys.PROTECTION_ENABLED] ?: true,
                onboardingCompleted = prefs[Keys.ONBOARDING_COMPLETED] ?: false,
                scheduleEnabled = prefs[Keys.SCHEDULE_ENABLED] ?: false,
                scheduleStartMinutes = prefs[Keys.SCHEDULE_START] ?: (8 * 60),
                scheduleEndMinutes = prefs[Keys.SCHEDULE_END] ?: (22 * 60),
                breakUntilMillis = prefs[Keys.BREAK_UNTIL] ?: 0L,
                scheduledBreakEnabled = prefs[Keys.SCHED_BREAK_ENABLED] ?: false,
                scheduledBreakStartMinutes = prefs[Keys.SCHED_BREAK_START] ?: (13 * 60),
                scheduledBreakDurationMinutes = prefs[Keys.SCHED_BREAK_DURATION] ?: 30,
                strictModeEnabled = prefs[Keys.STRICT_ENABLED] ?: false,
                editCooldownMinutes = prefs[Keys.EDIT_COOLDOWN_MINUTES] ?: 0,
                cooldownEndsAtMillis = prefs[Keys.COOLDOWN_ENDS_AT] ?: 0L,
                editUnlockUntilMillis = prefs[Keys.EDIT_UNLOCK_UNTIL] ?: 0L,
                themeMode = prefs[Keys.THEME_MODE] ?: SettingsState.THEME_SYSTEM,
                accessibilityWasEnabled = prefs[Keys.ACCESSIBILITY_WAS_ENABLED] ?: false
            )
        }
        .distinctUntilChanged()

    suspend fun current(): SettingsState = flow.first()

    suspend fun setProtectionEnabled(value: Boolean) =
        store.edit { it[Keys.PROTECTION_ENABLED] = value }

    suspend fun setOnboardingCompleted(value: Boolean) =
        store.edit { it[Keys.ONBOARDING_COMPLETED] = value }

    suspend fun setSchedule(enabled: Boolean, startMinutes: Int, endMinutes: Int) =
        store.edit {
            it[Keys.SCHEDULE_ENABLED] = enabled
            it[Keys.SCHEDULE_START] = startMinutes
            it[Keys.SCHEDULE_END] = endMinutes
        }

    suspend fun setBreakUntil(untilMillis: Long) =
        store.edit { it[Keys.BREAK_UNTIL] = untilMillis }

    suspend fun setScheduledBreak(enabled: Boolean, startMinutes: Int, durationMinutes: Int) =
        store.edit {
            it[Keys.SCHED_BREAK_ENABLED] = enabled
            it[Keys.SCHED_BREAK_START] = startMinutes
            it[Keys.SCHED_BREAK_DURATION] = durationMinutes
        }

    suspend fun setStrictModeEnabled(value: Boolean) =
        store.edit { it[Keys.STRICT_ENABLED] = value }

    suspend fun setEditCooldownMinutes(value: Int) =
        store.edit { it[Keys.EDIT_COOLDOWN_MINUTES] = value }

    suspend fun setCooldownEndsAt(millis: Long) =
        store.edit { it[Keys.COOLDOWN_ENDS_AT] = millis }

    suspend fun setEditUnlockUntil(millis: Long) =
        store.edit { it[Keys.EDIT_UNLOCK_UNTIL] = millis }

    suspend fun setThemeMode(value: Int) =
        store.edit { it[Keys.THEME_MODE] = value }

    suspend fun setAccessibilityWasEnabled(value: Boolean) =
        store.edit { it[Keys.ACCESSIBILITY_WAS_ENABLED] = value }

    /** Restores user-facing settings from a backup (not transient unlock state). */
    suspend fun importUserSettings(state: SettingsState) {
        store.edit {
            it[Keys.PROTECTION_ENABLED] = state.protectionEnabled
            it[Keys.SCHEDULE_ENABLED] = state.scheduleEnabled
            it[Keys.SCHEDULE_START] = state.scheduleStartMinutes
            it[Keys.SCHEDULE_END] = state.scheduleEndMinutes
            it[Keys.SCHED_BREAK_ENABLED] = state.scheduledBreakEnabled
            it[Keys.SCHED_BREAK_START] = state.scheduledBreakStartMinutes
            it[Keys.SCHED_BREAK_DURATION] = state.scheduledBreakDurationMinutes
            it[Keys.EDIT_COOLDOWN_MINUTES] = state.editCooldownMinutes
            it[Keys.THEME_MODE] = state.themeMode
        }
    }
}
