package com.focuslock.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.focuslock.app.R
import com.focuslock.app.data.AppIconCache
import com.focuslock.app.data.AppUiModel
import com.focuslock.app.databinding.FragmentEmergencyBinding
import com.focuslock.app.databinding.ItemBlockedAppBinding
import com.focuslock.app.domain.EmergencyManager
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.TimeUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Emergency Access screen: exactly 3 sessions per day, 10 minutes each.
 *
 * From here the user can see the remaining allowance, watch the live
 * countdown of a running session, and start a session for any currently
 * blocked app (always behind a confirmation dialog). The same flow is also
 * available directly on the blocking screen.
 */
class EmergencyFragment : Fragment() {

    private var _binding: FragmentEmergencyBinding? = null
    private val binding get() = _binding!!

    private var activePackage: String? = null
    private var activeEndsAt: Long = 0L

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEmergencyBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.activeSessionOpenButton.setOnClickListener {
            activePackage?.let { openApp(it) }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                while (true) {
                    updateCountdown()
                    delay(1_000L)
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) refresh()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    private fun refresh() {
        viewLifecycleOwner.lifecycleScope.launch {
            val context = requireContext()
            val app = context.focusLockApp
            val status = app.coordinator.tickEmergency()
            activePackage = status.activePackage
            activeEndsAt = status.activeEndsAtMillis

            val b = _binding ?: return@launch

            b.emergencySessionsText.text = getString(
                R.string.emergency_sessions_remaining,
                status.sessionsRemaining,
                EmergencyManager.MAX_SESSIONS_PER_DAY
            )
            b.emergencyUsedTodayText.text = getString(
                R.string.emergency_used_today,
                TimeUtils.formatDuration(status.totalEmergencyMillisToday)
            )

            // Active session card
            val active = status.activePackage
            if (active != null) {
                b.cardActiveSession.visibility = View.VISIBLE
                b.activeSessionIcon.setImageDrawable(
                    AppIconCache.get(context, active)
                )
                b.activeSessionAppText.text = getString(
                    R.string.emergency_session_running_for,
                    app.appsRepository.appLabel(active)
                )
                updateCountdown()
            } else {
                b.cardActiveSession.visibility = View.GONE
            }

            // All sessions used card
            b.cardAllUsed.visibility =
                if (status.sessionsRemaining <= 0 && active == null) View.VISIBLE
                else View.GONE

            // Currently blocked apps (must genuinely be blocked right now,
            // taking schedule/break/emergency state into account).
            val candidates = app.appsRepository.loadApps().filter { it.isOverLimit }
            val blocked = ArrayList<AppUiModel>()
            for (model in candidates) {
                if (app.coordinator.shouldBlock(model.packageName)) blocked += model
            }

            b.blockedAppsContainer.removeAllViews()
            b.noBlockedAppsText.visibility =
                if (blocked.isEmpty()) View.VISIBLE else View.GONE

            val inflater = LayoutInflater.from(context)
            for (model in blocked) {
                val item = ItemBlockedAppBinding.inflate(
                    inflater, b.blockedAppsContainer, false
                )
                item.blockedAppIcon.setImageDrawable(
                    AppIconCache.get(context, model.packageName)
                )
                item.blockedAppName.text = model.label
                item.blockedAppInfo.text =
                    getString(
                        R.string.used_today_label,
                        TimeUtils.formatDuration(model.usageTodayMillis)
                    ) + "  ·  " + getString(
                        R.string.limit_label,
                        TimeUtils.formatMinutes(model.limit?.dailyLimitMinutes ?: 0)
                    )
                item.blockedAppStartButton.isEnabled =
                    status.activePackage == null && status.sessionsRemaining > 0
                item.blockedAppStartButton.setOnClickListener {
                    confirmAndStart(model)
                }
                b.blockedAppsContainer.addView(item.root)
            }
        }
    }

    private fun updateCountdown() {
        val b = _binding ?: return
        if (activePackage == null || activeEndsAt <= 0L) return
        val remaining = activeEndsAt - System.currentTimeMillis()
        if (remaining <= 0L) {
            activePackage = null
            refresh()
        } else {
            b.activeSessionCountdown.text = getString(
                R.string.emergency_time_remaining,
                TimeUtils.formatCountdown(remaining)
            )
        }
    }

    private fun confirmAndStart(model: AppUiModel) {
        viewLifecycleOwner.lifecycleScope.launch {
            val app = requireContext().focusLockApp
            val status = app.coordinator.emergencyManager.status()
            if (!isAdded) return@launch
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.emergency_confirm_title)
                .setMessage(
                    getString(
                        R.string.emergency_confirm_msg,
                        model.label,
                        status.sessionsRemaining
                    )
                )
                .setPositiveButton(R.string.emergency_start_confirm) { _, _ ->
                    startSession(model)
                }
                .setNegativeButton(R.string.cancel, null)
                .show()
        }
    }

    private fun startSession(model: AppUiModel) {
        viewLifecycleOwner.lifecycleScope.launch {
            val app = requireContext().focusLockApp
            when (val result =
                app.coordinator.emergencyManager.startSession(model.packageName)) {
                is EmergencyManager.StartResult.Started -> {
                    app.coordinator.tickEmergency() // posts countdown notification
                    refresh()
                    openApp(model.packageName)
                }
                is EmergencyManager.StartResult.AlreadyActive -> {
                    val b = _binding ?: return@launch
                    val otherLabel = app.appsRepository.appLabel(result.packageName)
                    Snackbar.make(
                        b.root,
                        getString(
                            R.string.emergency_other_active,
                            otherLabel,
                            TimeUtils.formatCountdown(result.remainingMillis)
                        ),
                        Snackbar.LENGTH_LONG
                    ).show()
                    refresh()
                }
                EmergencyManager.StartResult.NoSessionsLeft -> {
                    val b = _binding ?: return@launch
                    Snackbar.make(
                        b.root,
                        getString(R.string.emergency_all_used),
                        Snackbar.LENGTH_LONG
                    ).show()
                    refresh()
                }
            }
        }
    }

    private fun openApp(packageName: String) {
        val launchIntent =
            requireContext().packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                startActivity(launchIntent)
                return
            } catch (e: Exception) {
                // fall through to error toast
            }
        }
        Toast.makeText(requireContext(), R.string.generic_error, Toast.LENGTH_SHORT).show()
    }
}
