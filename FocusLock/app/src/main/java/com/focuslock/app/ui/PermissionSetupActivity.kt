package com.focuslock.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.R
import com.google.android.material.R as MaterialR
import com.focuslock.app.databinding.ActivityPermissionSetupBinding
import com.focuslock.app.databinding.ItemPermissionBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.service.MonitorService
import com.focuslock.app.util.PermissionUtils
import com.google.android.material.color.MaterialColors
import kotlinx.coroutines.launch

/**
 * Permission setup / repair screen.
 *
 * Every permission is explained in plain language *before* the user is sent
 * to the corresponding Android Settings screen. FocusLock never enables
 * anything programmatically — the user flips every switch themselves, which
 * is both an Android requirement and the honest way to build this feature.
 */
class PermissionSetupActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPermissionSetupBinding
    private var rows: List<Row> = emptyList()
    private var notificationRequested = false

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {
            refreshStatuses()
        }

    private data class Row(
        val binding: ItemPermissionBinding,
        val titleRes: Int,
        val descRes: Int,
        val required: Boolean,
        /** Current state, or null when Android exposes no state (autostart). */
        val checker: () -> Boolean?,
        val action: () -> Unit
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPermissionSetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        rows = listOf(
            Row(
                binding = binding.permUsage,
                titleRes = R.string.perm_usage_title,
                descRes = R.string.perm_usage_desc,
                required = true,
                checker = { PermissionUtils.hasUsageAccess(this) },
                action = { openSettings(PermissionUtils.usageAccessSettingsIntent()) }
            ),
            Row(
                binding = binding.permAccessibility,
                titleRes = R.string.perm_accessibility_title,
                descRes = R.string.perm_accessibility_desc,
                required = true,
                checker = { PermissionUtils.isAccessibilityServiceEnabled(this) },
                action = { openSettings(PermissionUtils.accessibilitySettingsIntent()) }
            ),
            Row(
                binding = binding.permOverlay,
                titleRes = R.string.perm_overlay_title,
                descRes = R.string.perm_overlay_desc,
                required = false,
                checker = { PermissionUtils.canDrawOverlays(this) },
                action = { openSettings(PermissionUtils.overlaySettingsIntent(this)) }
            ),
            Row(
                binding = binding.permNotifications,
                titleRes = R.string.perm_notifications_title,
                descRes = R.string.perm_notifications_desc,
                required = false,
                checker = { PermissionUtils.areNotificationsEnabled(this) },
                action = { onNotificationsAction() }
            ),
            Row(
                binding = binding.permBattery,
                titleRes = R.string.perm_battery_title,
                descRes = R.string.perm_battery_desc,
                required = false,
                checker = { PermissionUtils.isIgnoringBatteryOptimizations(this) },
                action = { openSettings(PermissionUtils.batteryOptimizationIntent(this)) }
            ),
            Row(
                binding = binding.permAutostart,
                titleRes = R.string.perm_autostart_title,
                descRes = R.string.perm_autostart_desc,
                required = false,
                checker = { null },
                action = { PermissionUtils.openAutostartSettings(this) }
            )
        )

        for (row in rows) {
            row.binding.permTitle.text = getString(row.titleRes)
            row.binding.permDesc.text = getString(row.descRes)
            row.binding.permBadge.text = getString(
                if (row.required) R.string.perm_required_badge
                else R.string.perm_recommended_badge
            )
            row.binding.permButton.setOnClickListener { row.action() }
        }

        // When this screen is opened again later (from Settings/Dashboard),
        // show a back arrow; during first-run onboarding there is none.
        lifecycleScope.launch {
            val settings = focusLockApp.settingsStore.current()
            if (settings.onboardingCompleted) {
                binding.setupToolbar.navigationIcon =
                    ContextCompat.getDrawable(this@PermissionSetupActivity, R.drawable.ic_arrow_back)
                binding.setupToolbar.setNavigationOnClickListener { finish() }
                binding.setupSkipNote.visibility = View.GONE
            }
        }

        binding.setupContinueButton.setOnClickListener {
            lifecycleScope.launch {
                focusLockApp.settingsStore.setOnboardingCompleted(true)
                MonitorService.startIfProtectionEnabled(this@PermissionSetupActivity)
                finish()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // The user may be returning from a Settings screen.
        refreshStatuses()
    }

    private fun refreshStatuses() {
        for (row in rows) {
            val granted = row.checker()
            if (granted == null) {
                row.binding.permStatus.visibility = View.GONE
            } else {
                row.binding.permStatus.visibility = View.VISIBLE
                row.binding.permStatus.text = getString(
                    if (granted) R.string.perm_status_granted
                    else R.string.perm_status_missing
                )
                val colorAttr =
                    if (granted) MaterialR.attr.colorPrimary else MaterialR.attr.colorError
                row.binding.permStatus.setTextColor(
                    MaterialColors.getColor(row.binding.root, colorAttr)
                )
            }
        }
    }

    private fun onNotificationsAction() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted && !notificationRequested) {
                notificationRequested = true
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                return
            }
        }
        openSettings(PermissionUtils.notificationSettingsIntent(this))
    }

    private fun openSettings(intent: Intent) {
        try {
            startActivity(intent)
        } catch (e: Exception) {
            // Extremely defensive: fall back to this app's details page.
            try {
                startActivity(PermissionUtils.appDetailsIntent(this))
            } catch (e2: Exception) { /* nothing else we can do */ }
        }
    }
}
