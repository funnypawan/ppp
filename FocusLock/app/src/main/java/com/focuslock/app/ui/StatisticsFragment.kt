package com.focuslock.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.FocusLockApp
import com.focuslock.app.R
import com.focuslock.app.data.AppIconCache
import com.focuslock.app.databinding.FragmentStatisticsBinding
import com.focuslock.app.databinding.ItemStatAppBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.ui.views.BarChartView
import com.focuslock.app.util.PermissionUtils
import com.focuslock.app.util.TimeUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Calendar

/**
 * Statistics for Today / Yesterday / Last 7 days / Last 30 days:
 * total screen time, a daily-totals chart, per-app usage, plus FocusLock's
 * own measured numbers (blocked attempts, emergency sessions/time and an
 * explicitly-labelled "time protected" estimate).
 *
 * Blocked attempts are only ever counted by FocusLock itself at the moment
 * blocking actually happens — nothing is estimated or invented.
 */
class StatisticsFragment : Fragment() {

    private var _binding: FragmentStatisticsBinding? = null
    private val binding get() = _binding!!

    private enum class Range { TODAY, YESTERDAY, LAST_7, LAST_30 }
    private var currentRange: Range = Range.TODAY

    private data class PerAppRow(
        val packageName: String,
        val label: String,
        val millis: Long
    )

    private data class StatsData(
        val totalMillis: Long,
        val perApp: List<PerAppRow>,
        val dailyBars: List<BarChartView.Bar>
    )

    private data class FocusLockToday(
        val blockedAttempts: Int,
        val emergencySessionsUsed: Int,
        val emergencyMillis: Long,
        val timeProtectedMillis: Long
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStatisticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.statsPermissionButton.setOnClickListener {
            startActivity(Intent(requireContext(), PermissionSetupActivity::class.java))
        }

        binding.rangeChipGroup.setOnCheckedStateChangeListener { _, checkedIds ->
            currentRange = when {
                checkedIds.contains(R.id.chipRangeYesterday) -> Range.YESTERDAY
                checkedIds.contains(R.id.chipRange7) -> Range.LAST_7
                checkedIds.contains(R.id.chipRange30) -> Range.LAST_30
                else -> Range.TODAY
            }
            load()
        }
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) load()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    private fun load() {
        viewLifecycleOwner.lifecycleScope.launch {
            val context = requireContext()
            val app = context.focusLockApp
            val now = System.currentTimeMillis()

            val hasAccess = PermissionUtils.hasUsageAccess(context)
            _binding?.cardStatsPermission?.visibility =
                if (hasAccess) View.GONE else View.VISIBLE

            val stats = withContext(Dispatchers.IO) {
                computeStats(app, currentRange, now)
            }
            val focusToday = computeFocusLockToday(app, now)

            val b = _binding ?: return@launch

            b.statsTotalTime.text = TimeUtils.formatDuration(stats.totalMillis)

            // Daily chart (multi-day ranges only)
            if (stats.dailyBars.isNotEmpty()) {
                b.cardDailyChart.visibility = View.VISIBLE
                b.dailyChart.bars = stats.dailyBars
                b.dailyChart.contentDescription = getString(R.string.daily_overview)
            } else {
                b.cardDailyChart.visibility = View.GONE
            }

            // FocusLock's own measured counters (always "today", labelled as such)
            b.statsBlockedAttempts.text = focusToday.blockedAttempts.toString()
            b.statsEmergencySessions.text = focusToday.emergencySessionsUsed.toString()
            b.statsEmergencyTime.text = TimeUtils.formatDuration(focusToday.emergencyMillis)
            b.statsTimeProtected.text = TimeUtils.formatDuration(focusToday.timeProtectedMillis)

            // Per-app list
            b.statsAppsContainer.removeAllViews()
            b.statsAppsEmpty.visibility =
                if (stats.perApp.isEmpty()) View.VISIBLE else View.GONE
            val maxPerApp = stats.perApp.maxOfOrNull { it.millis } ?: 1L
            val inflater = LayoutInflater.from(context)
            for (row in stats.perApp) {
                val item = ItemStatAppBinding.inflate(inflater, b.statsAppsContainer, false)
                item.statAppIcon.setImageDrawable(
                    AppIconCache.get(context, row.packageName)
                )
                item.statAppName.text = row.label
                item.statAppTime.text = TimeUtils.formatDuration(row.millis)
                item.statAppProgress.setProgressCompat(
                    ((row.millis.toFloat() / maxPerApp.toFloat()) * 100).toInt(), false
                )
                b.statsAppsContainer.addView(item.root)
            }
        }
    }

    /** Runs on a background dispatcher. */
    private fun computeStats(app: FocusLockApp, range: Range, now: Long): StatsData {
        val tracker = app.usageTracker
        val pm = app.packageManager
        val startToday = TimeUtils.startOfDay(now)

        val begin: Long
        val end: Long
        when (range) {
            Range.TODAY -> { begin = startToday; end = now }
            Range.YESTERDAY -> { begin = addDays(startToday, -1); end = startToday }
            Range.LAST_7 -> { begin = addDays(startToday, -6); end = now }
            Range.LAST_30 -> { begin = addDays(startToday, -29); end = now }
        }

        // Event-based measurement is the most accurate; for 30 days the
        // system may have pruned raw events, so fall back to daily buckets.
        val raw: Map<String, Long> = if (range == Range.LAST_30) {
            tracker.foregroundTimeByStats(begin, end)
        } else {
            tracker.foregroundTimeByEvents(begin, end)
        }

        val total = raw.values.sum()

        val perApp = raw.entries
            .filter { (pkg, millis) ->
                millis > 0L && pkg != app.packageName &&
                    pm.getLaunchIntentForPackage(pkg) != null
            }
            .sortedByDescending { it.value }
            .take(15)
            .map { (pkg, millis) ->
                PerAppRow(pkg, app.appsRepository.appLabel(pkg), millis)
            }

        val dailyBars: List<BarChartView.Bar> = when (range) {
            Range.LAST_7, Range.LAST_30 -> {
                val days = if (range == Range.LAST_7) 7 else 30
                (days - 1 downTo 0).map { daysAgo ->
                    val dayStart = addDays(startToday, -daysAgo)
                    val dayEnd = if (daysAgo == 0) now else addDays(dayStart, 1)
                    val dayTotal = if (range == Range.LAST_7) {
                        tracker.foregroundTimeByEvents(dayStart, dayEnd).values.sum()
                    } else {
                        tracker.foregroundTimeByStats(dayStart, dayEnd).values.sum()
                    }
                    BarChartView.Bar(
                        valueMillis = dayTotal,
                        label = if (range == Range.LAST_7) {
                            TimeUtils.dayOfWeekLabel(dayStart)
                        } else {
                            TimeUtils.shortDateLabel(dayStart)
                        }
                    )
                }
            }
            else -> emptyList()
        }

        return StatsData(total, perApp, dailyBars)
    }

    private suspend fun computeFocusLockToday(app: FocusLockApp, now: Long): FocusLockToday {
        val rows = app.database.dailyUsageDao().getForDate(TimeUtils.dateKey(now))
        val blocked = rows.sumOf { it.blockedAttempts }
        var protectedMillis = 0L
        for (row in rows) {
            if (row.firstBlockedAtMillis > 0L) {
                protectedMillis +=
                    (now - row.firstBlockedAtMillis - row.emergencyMillisUsed)
                        .coerceAtLeast(0L)
            }
        }
        val status = app.coordinator.emergencyManager.status()
        return FocusLockToday(
            blockedAttempts = blocked,
            emergencySessionsUsed = status.sessionsUsedToday,
            emergencyMillis = status.totalEmergencyMillisToday,
            timeProtectedMillis = protectedMillis
        )
    }

    private fun addDays(epochMillis: Long, days: Int): Long {
        val cal = Calendar.getInstance()
        cal.timeInMillis = epochMillis
        cal.add(Calendar.DAY_OF_MONTH, days)
        return cal.timeInMillis
    }
}
