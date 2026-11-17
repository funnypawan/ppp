package `in`.focuslife.app.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "focuslife_prefs")

class PreferencesManager(private val context: Context) {
    companion object {
        val KEY_USER_NAME = stringPreferencesKey("user_name")
        val KEY_LANGUAGE = stringPreferencesKey("language") // en | hi
        val KEY_BLOCKED_APPS = stringSetPreferencesKey("blocked_apps")
        val KEY_ACTIVE_MODE = stringPreferencesKey("active_mode") // none, study, running, sleep, deep_focus
        val KEY_MODE_END_TIME = stringPreferencesKey("mode_end_time")
        val KEY_DAILY_SCREEN_LIMIT = intPreferencesKey("daily_screen_limit_min") // minutes
        val KEY_RUNNING_TARGET = intPreferencesKey("running_target_m") // meters, default 1600
        val KEY_REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
        val KEY_EMERGENCY_UNLOCK_COUNT = intPreferencesKey("emergency_unlock_count")
        val KEY_PERSONAL_REASONS = stringPreferencesKey("personal_reasons")
        val KEY_FOCUS_TASK = stringPreferencesKey("focus_task")
    }

    val userName: Flow<String> = context.dataStore.data.map { it[KEY_USER_NAME] ?: "" }
    val language: Flow<String> = context.dataStore.data.map { it[KEY_LANGUAGE] ?: "en" }
    val blockedApps: Flow<Set<String>> = context.dataStore.data.map { it[KEY_BLOCKED_APPS] ?: emptySet() }
    val activeMode: Flow<String> = context.dataStore.data.map { it[KEY_ACTIVE_MODE] ?: "none" }
    val dailyScreenLimitMin: Flow<Int> = context.dataStore.data.map { it[KEY_DAILY_SCREEN_LIMIT] ?: 180 }
    val runningTargetM: Flow<Int> = context.dataStore.data.map { it[KEY_RUNNING_TARGET] ?: 1600 }
    val remindersEnabled: Flow<Boolean> = context.dataStore.data.map { it[KEY_REMINDERS_ENABLED] ?: true }
    val personalReasons: Flow<String> = context.dataStore.data.map { it[KEY_PERSONAL_REASONS] ?: "" }
    val focusTask: Flow<String> = context.dataStore.data.map { it[KEY_FOCUS_TASK] ?: "" }

    suspend fun setUserName(name: String) { context.dataStore.edit { it[KEY_USER_NAME] = name } }
    suspend fun setLanguage(lang: String) { context.dataStore.edit { it[KEY_LANGUAGE] = lang } }
    suspend fun setBlockedApps(apps: Set<String>) { context.dataStore.edit { it[KEY_BLOCKED_APPS] = apps } }
    suspend fun setActiveMode(mode: String) { context.dataStore.edit { it[KEY_ACTIVE_MODE] = mode } }
    suspend fun setDailyScreenLimit(min: Int) { context.dataStore.edit { it[KEY_DAILY_SCREEN_LIMIT] = min } }
    suspend fun setRunningTarget(m: Int) { context.dataStore.edit { it[KEY_RUNNING_TARGET] = m } }
    suspend fun setRemindersEnabled(enabled: Boolean) { context.dataStore.edit { it[KEY_REMINDERS_ENABLED] = enabled } }
    suspend fun setPersonalReasons(text: String) { context.dataStore.edit { it[KEY_PERSONAL_REASONS] = text } }
    suspend fun setFocusTask(task: String) { context.dataStore.edit { it[KEY_FOCUS_TASK] = task } }

    suspend fun incrementEmergencyUnlock() {
        context.dataStore.edit {
            val current = it[KEY_EMERGENCY_UNLOCK_COUNT] ?: 0
            it[KEY_EMERGENCY_UNLOCK_COUNT] = current + 1
        }
    }

    suspend fun getBlockedAppsOnce(): Set<String> = blockedApps.first()
    suspend fun getActiveModeOnce(): String = activeMode.first()
}
