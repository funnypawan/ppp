package `in`.focuslife.app.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import `in`.focuslife.app.data.AppDatabase
import `in`.focuslife.app.data.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BlockerAccessibilityService : AccessibilityService() {
    private var lastBlockedAt: Long = 0

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName) return
        if (pkg == "com.android.systemui") return

        val now = System.currentTimeMillis()
        if (now - lastBlockedAt < 3000) return // debounce

        CoroutineScope(Dispatchers.IO).launch {
            val prefs = PreferencesManager(this@BlockerAccessibilityService)
            val mode = prefs.getActiveModeOnce()
            if (mode == "none") return@launch
            val blocked = prefs.getBlockedAppsOnce()
            if (pkg in blocked) {
                lastBlockedAt = now
                val intent = Intent(this@BlockerAccessibilityService, BlockerOverlayActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra(BlockerOverlayActivity.EXTRA_PACKAGE, pkg)
                    putExtra(BlockerOverlayActivity.EXTRA_MODE, mode)
                }
                startActivity(intent)
            }
        }
    }

    override fun onInterrupt() {}
}
