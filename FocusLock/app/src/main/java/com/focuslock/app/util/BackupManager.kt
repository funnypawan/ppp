package com.focuslock.app.util

import android.content.Context
import com.focuslock.app.data.AppLimitEntity
import com.focuslock.app.data.FocusLockDatabase
import com.focuslock.app.data.SettingsState
import com.focuslock.app.data.SettingsStore
import org.json.JSONArray
import org.json.JSONObject

/**
 * Settings export/import as a plain JSON file chosen by the user through
 * Android's file picker (Storage Access Framework). The file is written
 * wherever the user puts it — FocusLock has no server and uploads nothing.
 *
 * Exported: app limits + user settings (schedule, scheduled break,
 * cooldown, theme). Never exported: the Strict Mode PIN (not even its
 * hash), usage history or emergency counters.
 */
object BackupManager {

    private const val FORMAT_NAME = "FocusLockSettings"
    private const val FORMAT_VERSION = 1

    suspend fun exportToJson(context: Context): String {
        val database = FocusLockDatabase.getInstance(context)
        val settings = SettingsStore(context).current()
        val limits = database.appLimitDao().getAll()

        val limitsArray = JSONArray()
        for (limit in limits) {
            limitsArray.put(
                JSONObject().apply {
                    put("packageName", limit.packageName)
                    put("dailyLimitMinutes", limit.dailyLimitMinutes)
                    put("enabled", limit.enabled)
                    put("exempt", limit.exempt)
                }
            )
        }

        val root = JSONObject().apply {
            put("format", FORMAT_NAME)
            put("version", FORMAT_VERSION)
            put("exportedAtMillis", System.currentTimeMillis())
            put("limits", limitsArray)
            put(
                "settings",
                JSONObject().apply {
                    put("protectionEnabled", settings.protectionEnabled)
                    put("scheduleEnabled", settings.scheduleEnabled)
                    put("scheduleStartMinutes", settings.scheduleStartMinutes)
                    put("scheduleEndMinutes", settings.scheduleEndMinutes)
                    put("scheduledBreakEnabled", settings.scheduledBreakEnabled)
                    put("scheduledBreakStartMinutes", settings.scheduledBreakStartMinutes)
                    put("scheduledBreakDurationMinutes", settings.scheduledBreakDurationMinutes)
                    put("editCooldownMinutes", settings.editCooldownMinutes)
                    put("themeMode", settings.themeMode)
                }
            )
        }
        return root.toString(2)
    }

    /**
     * Imports a previously exported file.
     * @return number of app limits imported, or failure for invalid files.
     */
    suspend fun importFromJson(context: Context, json: String): Result<Int> {
        return try {
            val root = JSONObject(json)
            require(root.optString("format") == FORMAT_NAME) { "Not a FocusLock backup" }
            require(root.optInt("version", -1) == FORMAT_VERSION) { "Unsupported version" }

            val limitsArray = root.getJSONArray("limits")
            val limits = ArrayList<AppLimitEntity>(limitsArray.length())
            for (i in 0 until limitsArray.length()) {
                val item = limitsArray.getJSONObject(i)
                val pkg = item.getString("packageName")
                require(pkg.isNotBlank()) { "Blank package name" }
                limits += AppLimitEntity(
                    packageName = pkg,
                    dailyLimitMinutes = item.getInt("dailyLimitMinutes").coerceIn(0, 24 * 60),
                    enabled = item.optBoolean("enabled", true),
                    exempt = item.optBoolean("exempt", false),
                    updatedAtMillis = System.currentTimeMillis()
                )
            }

            val database = FocusLockDatabase.getInstance(context)
            database.appLimitDao().replaceAll(limits)

            val s = root.getJSONObject("settings")
            val current = SettingsStore(context).current()
            SettingsStore(context).importUserSettings(
                current.copy(
                    protectionEnabled = s.optBoolean("protectionEnabled", current.protectionEnabled),
                    scheduleEnabled = s.optBoolean("scheduleEnabled", current.scheduleEnabled),
                    scheduleStartMinutes = s.optInt("scheduleStartMinutes", current.scheduleStartMinutes),
                    scheduleEndMinutes = s.optInt("scheduleEndMinutes", current.scheduleEndMinutes),
                    scheduledBreakEnabled = s.optBoolean("scheduledBreakEnabled", current.scheduledBreakEnabled),
                    scheduledBreakStartMinutes = s.optInt("scheduledBreakStartMinutes", current.scheduledBreakStartMinutes),
                    scheduledBreakDurationMinutes = s.optInt("scheduledBreakDurationMinutes", current.scheduledBreakDurationMinutes),
                    editCooldownMinutes = s.optInt("editCooldownMinutes", current.editCooldownMinutes),
                    themeMode = s.optInt("themeMode", current.themeMode)
                        .coerceIn(SettingsState.THEME_SYSTEM, SettingsState.THEME_DARK)
                )
            )
            Result.success(limits.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
