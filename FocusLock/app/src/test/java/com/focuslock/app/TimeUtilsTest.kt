package com.focuslock.app

import com.focuslock.app.util.TimeUtils
import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

/**
 * Date-key / midnight maths behind the daily reset (requirements §6),
 * plus duration formatting used across the UI.
 */
class TimeUtilsTest {

    private val utc: TimeZone = TimeZone.getTimeZone("UTC")

    private fun utcMillis(year: Int, month: Int, day: Int, hour: Int, minute: Int): Long {
        val cal = Calendar.getInstance(utc)
        cal.set(year, month - 1, day, hour, minute, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    @Test
    fun `date key is the local calendar date`() {
        val t = utcMillis(2024, 1, 15, 12, 30)
        assertEquals("2024-01-15", TimeUtils.dateKey(t, utc))
    }

    @Test
    fun `date key rolls over at midnight, not after 24h of use`() {
        val beforeMidnight = utcMillis(2024, 1, 15, 23, 59)
        val afterMidnight = utcMillis(2024, 1, 16, 0, 1)
        assertEquals("2024-01-15", TimeUtils.dateKey(beforeMidnight, utc))
        assertEquals("2024-01-16", TimeUtils.dateKey(afterMidnight, utc))
    }

    @Test
    fun `start of day and next midnight bracket the day`() {
        val t = utcMillis(2024, 6, 30, 15, 45)
        assertEquals(utcMillis(2024, 6, 30, 0, 0), TimeUtils.startOfDay(t, utc))
        assertEquals(utcMillis(2024, 7, 1, 0, 0), TimeUtils.nextMidnight(t, utc))
    }

    @Test
    fun `minutes of day`() {
        assertEquals(0, TimeUtils.minutesOfDay(utcMillis(2024, 1, 1, 0, 0), utc))
        assertEquals(8 * 60 + 30, TimeUtils.minutesOfDay(utcMillis(2024, 1, 1, 8, 30), utc))
        assertEquals(1439, TimeUtils.minutesOfDay(utcMillis(2024, 1, 1, 23, 59), utc))
    }

    @Test
    fun `duration formatting`() {
        assertEquals("0m", TimeUtils.formatDuration(0L))
        assertEquals("0m", TimeUtils.formatDuration(-5L))
        assertEquals("45s", TimeUtils.formatDuration(45_000L))
        assertEquals("1m", TimeUtils.formatDuration(90_000L))
        assertEquals("45m", TimeUtils.formatDuration(45L * 60_000L))
        assertEquals("1h", TimeUtils.formatDuration(60L * 60_000L))
        assertEquals("1h 5m", TimeUtils.formatDuration(65L * 60_000L))
        assertEquals("2h", TimeUtils.formatMinutes(120))
        assertEquals("30m", TimeUtils.formatMinutes(30))
    }

    @Test
    fun `countdown formatting rounds up to whole seconds`() {
        assertEquals("10:00", TimeUtils.formatCountdown(600_000L))
        assertEquals("09:59", TimeUtils.formatCountdown(599_000L))
        assertEquals("01:01", TimeUtils.formatCountdown(61_000L))
        assertEquals("00:01", TimeUtils.formatCountdown(500L))
        assertEquals("00:00", TimeUtils.formatCountdown(0L))
        assertEquals("00:00", TimeUtils.formatCountdown(-1_000L))
    }
}
