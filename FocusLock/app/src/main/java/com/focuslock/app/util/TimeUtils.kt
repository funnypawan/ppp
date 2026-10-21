package com.focuslock.app.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

/**
 * Date/time helpers.
 *
 * Daily limits and emergency sessions are keyed by the *local calendar date*
 * (yyyy-MM-dd). Nothing depends on an alarm firing exactly at midnight:
 * whenever FocusLock wakes up it simply asks "what is today's date key?" and
 * a new day automatically means fresh usage and 3 new emergency sessions.
 * This survives reboots, Doze mode and timezone changes.
 */
object TimeUtils {

    private const val DATE_PATTERN = "yyyy-MM-dd"

    fun dateKey(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): String {
        val fmt = SimpleDateFormat(DATE_PATTERN, Locale.US)
        fmt.timeZone = timeZone
        return fmt.format(Date(epochMillis))
    }

    fun todayKey(now: Long = System.currentTimeMillis()): String = dateKey(now)

    /** Local midnight at the start of the day containing [epochMillis]. */
    fun startOfDay(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): Long {
        val cal = Calendar.getInstance(timeZone)
        cal.timeInMillis = epochMillis
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    /** The next local midnight strictly after the start of the current day. */
    fun nextMidnight(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): Long {
        val cal = Calendar.getInstance(timeZone)
        cal.timeInMillis = startOfDay(epochMillis, timeZone)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        return cal.timeInMillis
    }

    /** Minutes since local midnight, 0..1439. Used for schedules/breaks. */
    fun minutesOfDay(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): Int {
        val cal = Calendar.getInstance(timeZone)
        cal.timeInMillis = epochMillis
        return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    }

    /** "1h 23m", "45m", "30s", "0m" */
    fun formatDuration(millis: Long): String {
        if (millis <= 0L) return "0m"
        val totalMinutes = TimeUnit.MILLISECONDS.toMinutes(millis)
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60
        return when {
            hours > 0 && minutes > 0 -> "${hours}h ${minutes}m"
            hours > 0 -> "${hours}h"
            totalMinutes > 0 -> "${minutes}m"
            else -> "${TimeUnit.MILLISECONDS.toSeconds(millis)}s"
        }
    }

    fun formatMinutes(totalMinutes: Int): String =
        formatDuration(totalMinutes * 60_000L)

    /** Countdown "09:59". Rounds up so a fresh 10-minute session shows 10:00. */
    fun formatCountdown(millis: Long): String {
        val totalSeconds = (millis.coerceAtLeast(0L) + 999L) / 1000L
        val m = totalSeconds / 60
        val s = totalSeconds % 60
        return String.format(Locale.US, "%02d:%02d", m, s)
    }

    fun formatTimeOfDay(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): String {
        val fmt = SimpleDateFormat("h:mm a", Locale.getDefault())
        fmt.timeZone = timeZone
        return fmt.format(Date(epochMillis))
    }

    fun formatMinutesOfDay(minutesOfDay: Int): String {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, (minutesOfDay / 60) % 24)
        cal.set(Calendar.MINUTE, minutesOfDay % 60)
        cal.set(Calendar.SECOND, 0)
        return SimpleDateFormat("h:mm a", Locale.getDefault()).format(cal.time)
    }

    /** "Mon", "Tue" … for chart axis labels. */
    fun dayOfWeekLabel(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): String {
        val fmt = SimpleDateFormat("EEE", Locale.getDefault())
        fmt.timeZone = timeZone
        return fmt.format(Date(epochMillis))
    }

    /** "12 Oct" for chart axis labels. */
    fun shortDateLabel(epochMillis: Long, timeZone: TimeZone = TimeZone.getDefault()): String {
        val fmt = SimpleDateFormat("d MMM", Locale.getDefault())
        fmt.timeZone = timeZone
        return fmt.format(Date(epochMillis))
    }
}
