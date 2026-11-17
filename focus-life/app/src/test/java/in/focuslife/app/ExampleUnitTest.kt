package `in`.focuslife.app

import `in`.focuslife.app.data.Quotes
import `in`.focuslife.app.data.UsageHelper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun formatDuration_works() {
        assertEquals("45m", UsageHelper.formatDuration(45 * 60 * 1000L))
        assertEquals("1h 30m", UsageHelper.formatDuration(90 * 60 * 1000L))
        assertEquals("2h 0m", UsageHelper.formatDuration(120 * 60 * 1000L))
    }

    @Test
    fun dailyQuote_isNotBlank() {
        val q = Quotes.dailyQuote("2026-11-17", hindi = false)
        assertTrue(q.isNotBlank())
        val qHi = Quotes.dailyQuote("2026-11-17", hindi = true)
        assertTrue(qHi.isNotBlank())
    }

    @Test
    fun suggestions_includeLimitMessage() {
        val s = UsageHelper.suggestions(200 * 60 * 1000L, 180)
        assertTrue(s.isNotEmpty())
        assertTrue(s[0].contains("exceeded"))
    }
}
