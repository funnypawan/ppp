package com.focuslock.app

import android.app.Application
import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import com.focuslock.app.data.AppsRepository
import com.focuslock.app.data.FocusLockDatabase
import com.focuslock.app.data.PinManager
import com.focuslock.app.data.SettingsState
import com.focuslock.app.data.SettingsStore
import com.focuslock.app.data.UsageTracker
import com.focuslock.app.domain.ProtectionCoordinator
import com.focuslock.app.service.MaintenanceWorker
import com.focuslock.app.service.NotificationHelper
import com.google.android.material.color.DynamicColors
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Application class. Acts as a tiny service locator so UI and services share
 * the same database / repository / coordinator instances without a DI
 * framework (keeps the project simple and AndroidIDE-friendly).
 */
class FocusLockApp : Application() {

    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database: FocusLockDatabase by lazy { FocusLockDatabase.getInstance(this) }
    val settingsStore: SettingsStore by lazy { SettingsStore(this) }
    val pinManager: PinManager by lazy { PinManager(this) }
    val usageTracker: UsageTracker by lazy { UsageTracker(this) }
    val appsRepository: AppsRepository by lazy {
        AppsRepository(this, database, usageTracker)
    }
    val coordinator: ProtectionCoordinator by lazy {
        ProtectionCoordinator.getInstance(this)
    }

    override fun onCreate() {
        super.onCreate()

        // Material You dynamic color on Android 12+ (no-op on older versions).
        DynamicColors.applyToActivitiesIfAvailable(this)

        NotificationHelper.createChannels(this)

        // Apply the saved light/dark choice as soon as it is loaded.
        appScope.launch {
            val settings = settingsStore.flow.first()
            applyThemeMode(settings.themeMode)
        }

        // Periodic housekeeping (daily usage snapshots, pruning, health checks).
        MaintenanceWorker.schedulePeriodic(this)
    }

    companion object {
        fun applyThemeMode(themeMode: Int) {
            val mode = when (themeMode) {
                SettingsState.THEME_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
                SettingsState.THEME_DARK -> AppCompatDelegate.MODE_NIGHT_YES
                else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
            }
            AppCompatDelegate.setDefaultNightMode(mode)
        }
    }
}

/** Convenience accessor for activities/fragments/services. */
val Context.focusLockApp: FocusLockApp
    get() = applicationContext as FocusLockApp
