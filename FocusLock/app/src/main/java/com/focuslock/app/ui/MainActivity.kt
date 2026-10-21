package com.focuslock.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.R
import com.focuslock.app.databinding.ActivityMainBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.service.MonitorService
import kotlinx.coroutines.launch

/**
 * Hosts the five main destinations (Dashboard, All Apps, Statistics,
 * Emergency, Settings) behind a Material 3 bottom navigation bar.
 * Fragments are kept alive with show/hide so scroll positions and search
 * text survive tab switches.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var activeTag: String = TAB_DASHBOARD

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* optional */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (savedInstanceState != null) {
            activeTag = savedInstanceState.getString(KEY_ACTIVE_TAG, TAB_DASHBOARD)
        }

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            showTab(tagForItem(item.itemId))
            true
        }

        val initialTab = intent?.getStringExtra(EXTRA_TARGET_TAB) ?: activeTag
        // Setting the selected item triggers the listener above.
        binding.bottomNavigation.selectedItemId = itemForTag(initialTab)

        // First launch: walk the user through the required permissions.
        lifecycleScope.launch {
            val settings = focusLockApp.settingsStore.current()
            if (!settings.onboardingCompleted) {
                startActivity(Intent(this@MainActivity, PermissionSetupActivity::class.java))
            }
            MonitorService.startIfProtectionEnabled(this@MainActivity)
        }

        requestNotificationPermissionIfNeeded()
    }

    override fun onResume() {
        super.onResume()
        // Keep emergency bookkeeping/notifications accurate after the
        // process was killed, and warn early about revoked permissions.
        lifecycleScope.launch {
            focusLockApp.coordinator.tickEmergency()
            focusLockApp.coordinator.checkPermissionHealth()
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent?.getStringExtra(EXTRA_TARGET_TAB)?.let { selectTab(it) }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_ACTIVE_TAG, activeTag)
    }

    /** Used by fragments (e.g. Dashboard shortcuts) to change tabs. */
    fun selectTab(tag: String) {
        binding.bottomNavigation.selectedItemId = itemForTag(tag)
    }

    private fun showTab(tag: String) {
        val fm = supportFragmentManager
        val transaction = fm.beginTransaction()

        // Hide every other top-level fragment.
        for (fragment in fm.fragments) {
            if (fragment.tag != tag && !fragment.isHidden) {
                transaction.hide(fragment)
                transaction.setMaxLifecycle(fragment, Lifecycle.State.STARTED)
            }
        }

        var target = fm.findFragmentByTag(tag)
        if (target == null) {
            target = createFragment(tag)
            transaction.add(R.id.fragmentContainer, target, tag)
        }
        transaction.show(target)
        transaction.setMaxLifecycle(target, Lifecycle.State.RESUMED)
        transaction.commit()

        activeTag = tag
        binding.topAppBar.title = getString(titleResFor(tag))
    }

    private fun createFragment(tag: String): Fragment = when (tag) {
        TAB_APPS -> AppsFragment()
        TAB_STATS -> StatisticsFragment()
        TAB_EMERGENCY -> EmergencyFragment()
        TAB_SETTINGS -> SettingsFragment()
        else -> DashboardFragment()
    }

    private fun tagForItem(itemId: Int): String = when (itemId) {
        R.id.nav_apps -> TAB_APPS
        R.id.nav_stats -> TAB_STATS
        R.id.nav_emergency -> TAB_EMERGENCY
        R.id.nav_settings -> TAB_SETTINGS
        else -> TAB_DASHBOARD
    }

    private fun itemForTag(tag: String): Int = when (tag) {
        TAB_APPS -> R.id.nav_apps
        TAB_STATS -> R.id.nav_stats
        TAB_EMERGENCY -> R.id.nav_emergency
        TAB_SETTINGS -> R.id.nav_settings
        else -> R.id.nav_dashboard
    }

    private fun titleResFor(tag: String): Int = when (tag) {
        TAB_APPS -> R.string.nav_apps
        TAB_STATS -> R.string.nav_stats
        TAB_EMERGENCY -> R.string.nav_emergency
        TAB_SETTINGS -> R.string.nav_settings
        else -> R.string.app_name
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    companion object {
        const val EXTRA_TARGET_TAB = "com.focuslock.app.extra.TARGET_TAB"
        const val TAB_DASHBOARD = "dashboard"
        const val TAB_APPS = "apps"
        const val TAB_STATS = "stats"
        const val TAB_EMERGENCY = "emergency"
        const val TAB_SETTINGS = "settings"

        private const val KEY_ACTIVE_TAG = "active_tag"
    }
}
