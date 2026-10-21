package com.focuslock.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.focuslock.app.R
import com.focuslock.app.data.AppIconCache
import com.focuslock.app.data.AppUiModel
import com.focuslock.app.databinding.FragmentDashboardBinding
import com.focuslock.app.databinding.ItemTopAppBinding
import com.focuslock.app.domain.EmergencyManager
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.PermissionUtils
import com.focuslock.app.util.TimeUtils
import com.google.android.material.color.MaterialColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Dashboard: today's screen time, how many apps are protected / over their
 * limit, emergency sessions remaining, protection health and top apps.
 */
class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    private var emergencyEndsAt: Long = 0L
    private var emergencyActivePackage: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.statusFixButton.setOnClickListener { openSetup() }
        binding.usagePermissionButton.setOnClickListener { openSetup() }
        binding.viewAllAppsButton.setOnClickListener {
            (activity as? MainActivity)?.selectTab(MainActivity.TAB_APPS)
        }
        binding.emergencyStatCard.setOnClickListener {
            (activity as? MainActivity)?.selectTab(MainActivity.TAB_EMERGENCY)
        }
        binding.cardEmergencyActive.setOnClickListener {
            (activity as? MainActivity)?.selectTab(MainActivity.TAB_EMERGENCY)
        }

        // Keeps the emergency countdown ticking while the dashboard is shown.
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                while (true) {
                    updateEmergencyCountdown()
                    delay(1_000L)
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    private fun openSetup() {
        startActivity(Intent(requireContext(), PermissionSetupActivity::class.java))
    }

    private fun refresh() {
        viewLifecycleOwner.lifecycleScope.launch {
            val context = requireContext()
            val app = context.focusLockApp
            val now = System.currentTimeMillis()

            val health = PermissionUtils.health(context)
            val settings = app.settingsStore.current()
            val status = app.coordinator.tickEmergency(now)
            emergencyEndsAt = status.activeEndsAtMillis
            emergencyActivePackage = status.activePackage

            val apps: List<AppUiModel>
            val totalToday: Long
            if (health.usageAccess) {
                apps = app.appsRepository.loadApps(now)
                totalToday = withContext(Dispatchers.IO) {
                    app.usageTracker.usageSinceStartOfToday(now).values.sum()
                }
            } else {
                apps = emptyList()
                totalToday = 0L
            }

            val b = _binding ?: return@launch

            // Headline numbers
            b.statScreenTime.text = TimeUtils.formatDuration(totalToday)
            val protectedCount = apps.count { it.limitActive }
            val overLimitCount = apps.count { it.isOverLimit }
            b.statProtectedApps.text = protectedCount.toString()
            b.statOverLimit.text = overLimitCount.toString()
            b.statEmergencyLeft.text =
                "${status.sessionsRemaining}/${EmergencyManager.MAX_SESSIONS_PER_DAY}"

            // Protection status card
            when {
                !settings.protectionEnabled -> {
                    b.statusIcon.setImageDrawable(
                        ContextCompat.getDrawable(context, R.drawable.ic_warning)
                    )
                    b.statusIcon.setColorFilter(
                        MaterialColors.getColor(b.root, R.attr.colorError)
                    )
                    b.statusTitle.text = getString(R.string.protection_off)
                    b.statusDesc.text = getString(R.string.global_protection_desc)
                    b.statusFixButton.visibility = View.GONE
                }
                health.isDegraded -> {
                    b.statusIcon.setImageDrawable(
                        ContextCompat.getDrawable(context, R.drawable.ic_warning)
                    )
                    b.statusIcon.setColorFilter(
                        MaterialColors.getColor(b.root, R.attr.colorError)
                    )
                    b.statusTitle.text = getString(R.string.protection_degraded)
                    b.statusDesc.text = getString(R.string.protection_degraded_desc)
                    b.statusFixButton.visibility = View.VISIBLE
                }
                else -> {
                    b.statusIcon.setImageDrawable(
                        ContextCompat.getDrawable(context, R.drawable.ic_check_circle)
                    )
                    b.statusIcon.setColorFilter(
                        MaterialColors.getColor(b.root, R.attr.colorPrimary)
                    )
                    b.statusTitle.text = getString(R.string.protection_active)
                    b.statusDesc.text = getString(
                        R.string.notif_protection_sub, protectedCount, overLimitCount
                    )
                    b.statusFixButton.visibility = View.GONE
                }
            }

            // Usage Access missing card
            b.cardUsagePermission.visibility =
                if (health.usageAccess) View.GONE else View.VISIBLE

            // Break mode banner
            if (settings.isBreakActive(now)) {
                b.cardBreak.visibility = View.VISIBLE
                b.breakText.text = getString(
                    R.string.break_active_until,
                    TimeUtils.formatTimeOfDay(settings.breakEndsAt(now))
                )
            } else {
                b.cardBreak.visibility = View.GONE
            }

            // Emergency session banner
            val activePkg = status.activePackage
            if (activePkg != null) {
                b.cardEmergencyActive.visibility = View.VISIBLE
                b.emergencyActiveAppText.text = getString(
                    R.string.emergency_session_running_for,
                    app.appsRepository.appLabel(activePkg)
                )
                updateEmergencyCountdown()
            } else {
                b.cardEmergencyActive.visibility = View.GONE
            }

            bindTopApps(b, apps)
        }
    }

    private fun bindTopApps(b: FragmentDashboardBinding, apps: List<AppUiModel>) {
        val top = apps
            .filter { it.usageTodayMillis > 0L }
            .sortedByDescending { it.usageTodayMillis }
            .take(5)

        b.topAppsContainer.removeAllViews()
        b.topAppsEmpty.visibility = if (top.isEmpty()) View.VISIBLE else View.GONE

        val inflater = LayoutInflater.from(b.root.context)
        for (model in top) {
            val item = ItemTopAppBinding.inflate(inflater, b.topAppsContainer, false)
            item.topAppIcon.setImageDrawable(
                AppIconCache.get(b.root.context, model.packageName)
            )
            item.topAppName.text = model.label
            item.topAppUsage.text = TimeUtils.formatDuration(model.usageTodayMillis)
            if (model.limitActive) {
                item.topAppProgress.visibility = View.VISIBLE
                item.topAppProgress.setProgressCompat(
                    (model.progress * 100).toInt(), false
                )
            } else {
                item.topAppProgress.visibility = View.GONE
            }
            item.root.setOnClickListener {
                (activity as? MainActivity)?.selectTab(MainActivity.TAB_APPS)
            }
            b.topAppsContainer.addView(item.root)
        }
    }

    private fun updateEmergencyCountdown() {
        val b = _binding ?: return
        if (emergencyActivePackage == null || emergencyEndsAt <= 0L) return
        val remaining = emergencyEndsAt - System.currentTimeMillis()
        if (remaining <= 0L) {
            // Session just ended: reload everything (blocking is back on).
            emergencyActivePackage = null
            refresh()
        } else {
            b.emergencyCountdownText.text = getString(
                R.string.emergency_time_remaining,
                TimeUtils.formatCountdown(remaining)
            )
        }
    }
}
