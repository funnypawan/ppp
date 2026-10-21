package com.focuslock.app.service

import android.accessibilityservice.AccessibilityService
import android.os.PowerManager
import android.view.accessibility.AccessibilityEvent
import com.focuslock.app.domain.BlockingState
import com.focuslock.app.domain.ProtectionCoordinator
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * AccessibilityService used ONLY to learn which app moved to the foreground
 * (TYPE_WINDOW_STATE_CHANGED events), so over-limit apps can be blocked the
 * instant they are opened.
 *
 * Privacy guarantees (see res/xml/accessibility_service_config.xml):
 *  - `canRetrieveWindowContent` is false: the service is technically unable
 *    to read text, passwords or anything displayed on screen.
 *  - The only data used is the package name from window-change events.
 *  - Nothing is uploaded anywhere; FocusLock has no network access at all.
 *
 * The user enables this service manually in Android Settings after reading
 * the in-app explanation, and can disable it there at any time.
 *
 * While bound, the service also runs a light 3-second poll. Window events
 * alone cannot notice (a) an app reaching its limit while it is already
 * open, or (b) an emergency session expiring mid-use — the poll covers both.
 */
class FocusLockAccessibilityService : AccessibilityService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val coordinator: ProtectionCoordinator by lazy {
        ProtectionCoordinator.getInstance(this)
    }

    @Volatile
    private var lastForegroundPackage: String? = null

    private var pollJob: Job? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true

        pollJob?.cancel()
        pollJob = scope.launch {
            while (isActive) {
                try {
                    if (isScreenInteractive()) {
                        val pkg = lastForegroundPackage
                        // onForegroundPackage also performs emergency-expiry
                        // bookkeeping, so this one call covers everything.
                        val blocked = coordinator.onForegroundPackage(pkg)
                        if (blocked != null) ensureBlockingVisible(blocked)
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    // Never let a transient error kill protection.
                }
                delay(POLL_INTERVAL_MS)
            }
        }

        // Best-effort: also run the foreground monitor service as a second
        // layer. On Android 12+ a background start may be refused here;
        // the accessibility poll above keeps protection working regardless.
        scope.launch {
            try {
                MonitorService.startIfProtectionEnabled(this@FocusLockAccessibilityService)
            } catch (e: Exception) { /* see above */ }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString()?.takeIf { it.isNotBlank() } ?: return

        lastForegroundPackage = pkg
        if (pkg == packageName) return // FocusLock's own UI (incl. blocking screen)

        scope.launch {
            try {
                val blocked = coordinator.onForegroundPackage(pkg)
                if (blocked != null) ensureBlockingVisible(blocked)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Poll loop will retry within a few seconds.
            }
        }
    }

    /**
     * Fallback: if the blocking activity could not be launched (some OEMs
     * restrict background activity starts aggressively), send the user to
     * the Home screen so the blocked app at least leaves the foreground.
     * The next launch attempt happens on the following poll/event.
     */
    private suspend fun ensureBlockingVisible(blockedPackage: String) {
        delay(900L)
        if (BlockingState.visiblePackage != blockedPackage &&
            lastForegroundPackage == blockedPackage
        ) {
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }

    private fun isScreenInteractive(): Boolean {
        val powerManager = getSystemService(POWER_SERVICE) as? PowerManager
        return powerManager?.isInteractive ?: true
    }

    override fun onInterrupt() {
        // No feedback is being provided; nothing to interrupt.
    }

    override fun onDestroy() {
        isRunning = false
        pollJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        /** True while the service is bound (used for degraded-protection UI). */
        @Volatile
        var isRunning: Boolean = false
            private set

        private const val POLL_INTERVAL_MS = 3_000L
    }
}
