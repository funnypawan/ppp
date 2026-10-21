package com.focuslock.app.ui

import android.view.LayoutInflater
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.FocusLockApp
import com.focuslock.app.R
import com.focuslock.app.databinding.DialogCooldownBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.TimeUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Strict Mode gate placed in front of sensitive actions (editing limits,
 * disabling protection, starting breaks, changing the protection schedule…).
 *
 * Behaviour when Strict Mode is on and a PIN is set:
 *  1. The user must enter the PIN.
 *  2. If a cooldown is configured, a countdown must elapse before editing
 *     unlocks. The countdown end-time is persisted, so closing the dialog
 *     or the app does not skip it.
 *  3. After a successful unlock, editing stays available for a short
 *     window (2 minutes) so several apps can be adjusted in one sitting.
 *
 * When Strict Mode is off, actions run immediately.
 */
object StrictGate {

    private const val UNLOCK_WINDOW_MS = 2L * 60L * 1000L

    /** Full gate: PIN + optional cooldown. Use for limit edits & disabling. */
    fun requestAccess(fragment: Fragment, onGranted: () -> Unit) {
        val app = fragment.requireContext().focusLockApp
        fragment.lifecycleScope.launch {
            if (!isGateActive(app)) {
                onGranted()
                return@launch
            }
            val now = System.currentTimeMillis()
            if (now < app.settingsStore.current().editUnlockUntilMillis) {
                onGranted()
                return@launch
            }
            if (!fragment.isAdded) return@launch
            PinDialogs.showVerifyPin(
                activity = fragment.requireActivity(),
                pinManager = app.pinManager,
                scope = fragment.lifecycleScope,
                onSuccess = { startCooldownFlow(fragment, app, onGranted) }
            )
        }
    }

    /** PIN-only gate (no cooldown). Use for settings that weaken protection. */
    fun requestPinOnly(fragment: Fragment, onGranted: () -> Unit) {
        val app = fragment.requireContext().focusLockApp
        fragment.lifecycleScope.launch {
            if (!isGateActive(app)) {
                onGranted()
                return@launch
            }
            if (!fragment.isAdded) return@launch
            PinDialogs.showVerifyPin(
                activity = fragment.requireActivity(),
                pinManager = app.pinManager,
                scope = fragment.lifecycleScope,
                onSuccess = onGranted
            )
        }
    }

    private suspend fun isGateActive(app: FocusLockApp): Boolean {
        val settings = app.settingsStore.current()
        return settings.strictModeEnabled && app.pinManager.isPinSet()
    }

    private fun startCooldownFlow(fragment: Fragment, app: FocusLockApp, onGranted: () -> Unit) {
        fragment.lifecycleScope.launch {
            val settings = app.settingsStore.current()
            val now = System.currentTimeMillis()
            if (settings.editCooldownMinutes <= 0) {
                grantUnlock(app, now)
                onGranted()
                return@launch
            }
            var endsAt = settings.cooldownEndsAtMillis
            if (endsAt <= now) {
                // Start (or restart) the cooldown and persist its end time.
                endsAt = now + settings.editCooldownMinutes * 60_000L
                app.settingsStore.setCooldownEndsAt(endsAt)
            }
            if (fragment.isAdded) {
                showCooldownDialog(fragment, app, endsAt, onGranted)
            }
        }
    }

    private fun showCooldownDialog(
        fragment: Fragment,
        app: FocusLockApp,
        endsAtMillis: Long,
        onGranted: () -> Unit
    ) {
        val activity = fragment.requireActivity()
        val binding = DialogCooldownBinding.inflate(LayoutInflater.from(activity))
        val dialog = MaterialAlertDialogBuilder(activity)
            .setTitle(R.string.strict_cooldown_title)
            .setView(binding.root)
            .setNegativeButton(R.string.cancel, null)
            .create()
        dialog.show()

        fragment.lifecycleScope.launch {
            while (dialog.isShowing) {
                val remaining = endsAtMillis - System.currentTimeMillis()
                if (remaining <= 0L) break
                binding.cooldownMessageText.text = activity.getString(
                    R.string.strict_cooldown_msg,
                    TimeUtils.formatCountdown(remaining)
                )
                delay(500L)
            }
            if (dialog.isShowing) {
                val now = System.currentTimeMillis()
                if (now >= endsAtMillis) {
                    grantUnlock(app, now)
                    dialog.dismiss()
                    if (fragment.isAdded) onGranted()
                }
            }
        }
    }

    private suspend fun grantUnlock(app: FocusLockApp, now: Long) {
        app.settingsStore.setCooldownEndsAt(0L)
        app.settingsStore.setEditUnlockUntil(now + UNLOCK_WINDOW_MS)
    }
}
