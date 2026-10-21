package com.focuslock.app

import com.focuslock.app.data.AppLimitEntity
import com.focuslock.app.domain.BlockEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Blocking rules and limit-editing maths (requirements §2, §3, §4).
 */
class BlockEngineTest {

    private fun input(
        usageMinutes: Long,
        limitMinutes: Int? = 30,
        limitEnabled: Boolean = true,
        exempt: Boolean = false,
        protectionEnabled: Boolean = true,
        emergencyActive: Boolean = false,
        withinSchedule: Boolean = true,
        breakActive: Boolean = false,
        systemExempt: Boolean = false
    ): BlockEngine.Input = BlockEngine.Input(
        packageName = "com.example.app",
        usageTodayMillis = usageMinutes * 60_000L,
        limit = limitMinutes?.let {
            AppLimitEntity("com.example.app", it, enabled = limitEnabled, exempt = exempt)
        },
        protectionEnabled = protectionEnabled,
        emergencyActiveForPackage = emergencyActive,
        withinSchedule = withinSchedule,
        breakActive = breakActive,
        systemExempt = systemExempt
    )

    /** Test 1: a 5-minute limit blocks after exactly 5 minutes of use. */
    @Test
    fun `blocks exactly when the limit is reached`() {
        assertFalse(BlockEngine.shouldBlock(input(usageMinutes = 4, limitMinutes = 5)))
        assertTrue(BlockEngine.shouldBlock(input(usageMinutes = 5, limitMinutes = 5)))
        assertTrue(BlockEngine.shouldBlock(input(usageMinutes = 6, limitMinutes = 5)))
    }

    /** Test 2: used 25m, limit raised 30m -> 60m leaves 35m remaining. */
    @Test
    fun `raising a limit recomputes remaining from existing usage`() {
        val used = 25L * 60_000L
        assertEquals(5L * 60_000L, BlockEngine.remainingMillis(used, 30))
        assertEquals(35L * 60_000L, BlockEngine.remainingMillis(used, 60))
        assertFalse(BlockEngine.shouldBlock(input(usageMinutes = 25, limitMinutes = 60)))
    }

    /** Test 6: lowering a limit below current usage blocks immediately. */
    @Test
    fun `lowering a limit below usage blocks immediately`() {
        val used = 25L * 60_000L
        assertEquals(0L, BlockEngine.remainingMillis(used, 20))
        assertTrue(BlockEngine.shouldBlock(input(usageMinutes = 25, limitMinutes = 20)))
    }

    @Test
    fun `no limit means never blocked`() {
        assertFalse(BlockEngine.shouldBlock(input(usageMinutes = 600, limitMinutes = null)))
    }

    @Test
    fun `disabled limit does not block`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 60, limitEnabled = false))
        )
    }

    @Test
    fun `exempt essential apps are never blocked`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 600, exempt = true))
        )
    }

    @Test
    fun `system exempt packages are never blocked`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 600, systemExempt = true))
        )
    }

    @Test
    fun `active emergency session allows the app`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 60, emergencyActive = true))
        )
    }

    @Test
    fun `outside the protection schedule nothing is blocked`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 60, withinSchedule = false))
        )
    }

    @Test
    fun `break mode pauses blocking`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 60, breakActive = true))
        )
    }

    @Test
    fun `global protection off disables all blocking`() {
        assertFalse(
            BlockEngine.shouldBlock(input(usageMinutes = 60, protectionEnabled = false))
        )
    }

    @Test
    fun `isOverLimit ignores schedule but respects exempt and disabled`() {
        val limit = AppLimitEntity("com.example.app", 30)
        assertTrue(BlockEngine.isOverLimit(30L * 60_000L, limit))
        assertFalse(BlockEngine.isOverLimit(29L * 60_000L, limit))
        assertFalse(BlockEngine.isOverLimit(60L * 60_000L, limit.copy(exempt = true)))
        assertFalse(BlockEngine.isOverLimit(60L * 60_000L, limit.copy(enabled = false)))
        assertFalse(BlockEngine.isOverLimit(60L * 60_000L, null))
    }

    @Test
    fun `different apps have fully independent limits`() {
        val instagram = AppLimitEntity("com.instagram.android", 30)
        val youtube = AppLimitEntity("com.google.android.youtube", 60)
        val used45 = 45L * 60_000L
        assertTrue(BlockEngine.isOverLimit(used45, instagram))
        assertFalse(BlockEngine.isOverLimit(used45, youtube))
    }
}
