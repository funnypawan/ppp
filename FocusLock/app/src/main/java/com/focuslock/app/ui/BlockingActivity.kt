package com.focuslock.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.R
import com.focuslock.app.databinding.ActivityBlockingBinding
import com.focuslock.app.domain.BlockingState
import com.focuslock.app.domain.EmergencyManager
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.TimeUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Full-screen blocking screen shown when an app reaches its daily limit.
 *
 * Offers exactly two ways out:
 *  - "Return to Home", or
 *  - starting one of the day's three 10-minute Emergency Access sessions
 *    (after a confirmation dialog).
 *
 * The screen re-checks the block state every second, so it dismisses
 * itself if the situation changes (limit edited, break started, midnight
 * passed) and re-blocks instantly when an emergency session expires.
 */
class BlockingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBlockingBinding
    private var blockedPackage: String? = null
    private var startingSession: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBlockingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        blockedPackage = intent?.getStringExtra(EXTRA_PACKAGE_NAME)
        if (blockedPackage.isNullOrBlank()) {
            finish()
            return
        }

        binding.homeButton.setOnClickListener { goHome() }
        binding.emergencyButton.setOnClickListener { confirmAndStartEmergency() }
        binding.openAppButton.setOnClickListener { openBlockedApp() }

        // Back must not return to the blocked app — it goes Home instead.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = goHome()
        })

        lifecycleScope.launch {
            while (isActive) {
                refreshUi()
                delay(1_000L)
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent?.getStringExtra(EXTRA_PACKAGE_NAME)?.let { blockedPackage = it }
    }

    override fun onResume() {
        super.onResume()
        BlockingState.visiblePackage = blockedPackage
    }

    override fun onPause() {
        super.onPause()
        if (BlockingState.visiblePackage == blockedPackage) {
            BlockingState.visiblePackage = null
        }
    }

    override fun onDestroy() {
        if (BlockingState.visiblePackage == blockedPackage) {
            BlockingState.visiblePackage = null
        }
        super.onDestroy()
    }

    private suspend fun refreshUi() {
        val pkg = blockedPackage ?: return
        val app = focusLockApp
        val coordinator = app.coordinator

        val status = coordinator.tickEmergency()
        val emergencyForThisApp =
            status.activePackage == pkg && status.activeRemainingMillis > 0L
        val shouldBlock = coordinator.shouldBlock(pkg)

        if (!shouldBlock && !emergencyForThisApp) {
            // Limit raised, protection paused, break started or the day
            // rolled over: the app underneath is usable again.
            finish()
            return
        }

        val label = app.appsRepository.appLabel(pkg)
        val usage = app.appsRepository.effectiveUsageToday(pkg)
        val limit = app.database.appLimitDao().getForPackage(pkg)
        val now = System.currentTimeMillis()

        binding.blockedAppIcon.setImageDrawable(app.appsRepository.appIcon(pkg))
        binding.blockedAppName.text = label
        binding.blockingUsedText.text =
            getString(R.string.blocking_used, TimeUtils.formatDuration(usage))
        binding.blockingLimitText.text = getString(
            R.string.blocking_limit,
            if (limit != null) TimeUtils.formatMinutes(limit.dailyLimitMinutes)
            else getString(R.string.unlimited)
        )
        binding.blockingResetText.text = getString(
            R.string.blocking_reset,
            TimeUtils.formatTimeOfDay(TimeUtils.nextMidnight(now))
        )

        when {
            emergencyForThisApp -> {
                binding.emergencyButton.visibility = View.GONE
                binding.openAppButton.visibility = View.VISIBLE
                binding.openAppButton.text = getString(R.string.blocking_open_app, label)
                binding.blockingEmergencyCountdown.visibility = View.VISIBLE
                binding.blockingEmergencyCountdown.text = getString(
                    R.string.emergency_time_remaining,
                    TimeUtils.formatCountdown(status.activeRemainingMillis)
                )
                binding.blockingEmergencyInfo.text =
                    getString(R.string.emergency_active_title)
                binding.blockingEmergencyNote.visibility = View.GONE
            }
            status.activePackage != null -> {
                // A session is running for a different app (single-session rule).
                val otherLabel = app.appsRepository.appLabel(status.activePackage)
                binding.emergencyButton.visibility = View.VISIBLE
                binding.emergencyButton.isEnabled = false
                binding.openAppButton.visibility = View.GONE
                binding.blockingEmergencyCountdown.visibility = View.GONE
                binding.blockingEmergencyInfo.text = getString(
                    R.string.blocking_emergency_left,
                    status.sessionsRemaining,
                    EmergencyManager.MAX_SESSIONS_PER_DAY
                )
                binding.blockingEmergencyNote.visibility = View.VISIBLE
                binding.blockingEmergencyNote.text = getString(
                    R.string.emergency_other_active,
                    otherLabel,
                    TimeUtils.formatCountdown(status.activeRemainingMillis)
                )
            }
            status.sessionsRemaining <= 0 -> {
                binding.emergencyButton.visibility = View.VISIBLE
                binding.emergencyButton.isEnabled = false
                binding.openAppButton.visibility = View.GONE
                binding.blockingEmergencyCountdown.visibility = View.GONE
                binding.blockingEmergencyInfo.text = getString(
                    R.string.blocking_emergency_left,
                    0,
                    EmergencyManager.MAX_SESSIONS_PER_DAY
                )
                binding.blockingEmergencyNote.visibility = View.VISIBLE
                binding.blockingEmergencyNote.text = getString(R.string.emergency_all_used)
            }
            else -> {
                binding.emergencyButton.visibility = View.VISIBLE
                binding.emergencyButton.isEnabled = !startingSession
                binding.openAppButton.visibility = View.GONE
                binding.blockingEmergencyCountdown.visibility = View.GONE
                binding.blockingEmergencyInfo.text = getString(
                    R.string.blocking_emergency_left,
                    status.sessionsRemaining,
                    EmergencyManager.MAX_SESSIONS_PER_DAY
                )
                binding.blockingEmergencyNote.visibility = View.GONE
            }
        }
    }

    private fun confirmAndStartEmergency() {
        val pkg = blockedPackage ?: return
        if (startingSession) return // extra double-tap guard (manager also guards)
        val app = focusLockApp

        lifecycleScope.launch {
            val status = app.coordinator.emergencyManager.status()
            val label = app.appsRepository.appLabel(pkg)
            MaterialAlertDialogBuilder(this@BlockingActivity)
                .setTitle(R.string.emergency_confirm_title)
                .setMessage(
                    getString(
                        R.string.emergency_confirm_msg,
                        label,
                        status.sessionsRemaining
                    )
                )
                .setPositiveButton(R.string.emergency_start_confirm) { _, _ ->
                    startEmergencySession(pkg)
                }
                .setNegativeButton(R.string.cancel, null)
                .show()
        }
    }

    private fun startEmergencySession(pkg: String) {
        if (startingSession) return
        startingSession = true
        binding.emergencyButton.isEnabled = false
        lifecycleScope.launch {
            val app = focusLockApp
            when (val result = app.coordinator.emergencyManager.startSession(pkg)) {
                is EmergencyManager.StartResult.Started -> {
                    // Post the visible countdown, then hand over to the app.
                    app.coordinator.tickEmergency()
                    openBlockedApp()
                }
                is EmergencyManager.StartResult.AlreadyActive -> {
                    startingSession = false
                    if (result.packageName == pkg) openBlockedApp() else refreshUi()
                }
                EmergencyManager.StartResult.NoSessionsLeft -> {
                    startingSession = false
                    refreshUi()
                }
            }
        }
    }

    private fun openBlockedApp() {
        val pkg = blockedPackage ?: return
        val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                startActivity(launchIntent)
            } catch (e: Exception) {
                goHome()
                return
            }
        }
        finish()
    }

    private fun goHome() {
        val home = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            startActivity(home)
        } catch (e: Exception) { /* no launcher found — just close */ }
        finish()
    }

    companion object {
        const val EXTRA_PACKAGE_NAME = "com.focuslock.app.extra.BLOCKED_PACKAGE"
    }
}
