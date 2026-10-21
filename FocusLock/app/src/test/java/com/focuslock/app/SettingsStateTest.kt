package com.focuslock.app

import com.focuslock.app.data.SettingsState
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar

/**
 * Protection schedule and break-window logic
 * (additional features §5 Protection Schedule, §6 Break Mode).
 */
class SettingsStateTest {

    /** A timestamp at the given local wall-clock time today. */
    private fun atTime(hour: Int, minute: Int): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, hour)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    @Test
    fun `schedule disabled means always within schedule`() {
        val settings = SettingsState(scheduleEnabled = false)
        assertTrue(settings.isWithinSchedule(atTime(3, 0)))
        assertTrue(settings.isWithinSchedule(atTime(15, 0)))
    }

    @Test
    fun `daytime schedule window is start inclusive, end exclusive`() {
        val settings = SettingsState(
            scheduleEnabled = true,
            scheduleStartMinutes = 8 * 60,
            scheduleEndMinutes = 22 * 60
        )
        assertFalse(settings.isWithinSchedule(atTime(7, 59)))
        assertTrue(settings.isWithinSchedule(atTime(8, 0)))
        assertTrue(settings.isWithinSchedule(atTime(21, 59)))
        assertFalse(settings.isWithinSchedule(atTime(22, 0)))
    }

    @Test
    fun `overnight schedule window wraps past midnight`() {
        val settings = SettingsState(
            scheduleEnabled = true,
            scheduleStartMinutes = 21 * 60,
            scheduleEndMinutes = 6 * 60
        )
        assertTrue(settings.isWithinSchedule(atTime(23, 30)))
        assertTrue(settings.isWithinSchedule(atTime(5, 59)))
        assertFalse(settings.isWithinSchedule(atTime(6, 0)))
        assertFalse(settings.isWithinSchedule(atTime(12, 0)))
    }

    @Test
    fun `manual break is active until its end time`() {
        val start = atTime(12, 0)
        val settings = SettingsState(breakUntilMillis = start + 15L * 60_000L)
        assertTrue(settings.isBreakActive(start))
        assertTrue(settings.isBreakActive(start + 14L * 60_000L))
        assertFalse(settings.isBreakActive(start + 15L * 60_000L))
    }

    @Test
    fun `scheduled daily break window`() {
        val settings = SettingsState(
            scheduledBreakEnabled = true,
            scheduledBreakStartMinutes = 13 * 60,
            scheduledBreakDurationMinutes = 30
        )
        assertFalse(settings.isBreakActive(atTime(12, 59)))
        assertTrue(settings.isBreakActive(atTime(13, 0)))
        assertTrue(settings.isBreakActive(atTime(13, 29)))
        assertFalse(settings.isBreakActive(atTime(13, 30)))
    }

    @Test
    fun `scheduled break can cross midnight`() {
        val settings = SettingsState(
            scheduledBreakEnabled = true,
            scheduledBreakStartMinutes = 23 * 60 + 50,
            scheduledBreakDurationMinutes = 30
        )
        assertTrue(settings.isBreakActive(atTime(23, 55)))
        assertTrue(settings.isBreakActive(atTime(0, 10)))
        assertFalse(settings.isBreakActive(atTime(0, 25)))
    }

    @Test
    fun `no break configured means no break`() {
        val settings = SettingsState()
        assertFalse(settings.isBreakActive(atTime(13, 15)))
    }
}
