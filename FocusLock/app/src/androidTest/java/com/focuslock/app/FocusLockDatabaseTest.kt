package com.focuslock.app

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.focuslock.app.data.AppLimitEntity
import com.focuslock.app.data.EmergencyStateEntity
import com.focuslock.app.data.FocusLockDatabase
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented Room tests: limits persist independently per app,
 * blocked-attempt bookkeeping works, emergency rows round-trip.
 * Run with: ./gradlew connectedDebugAndroidTest
 */
@RunWith(AndroidJUnit4::class)
class FocusLockDatabaseTest {

    private lateinit var db: FocusLockDatabase

    @Before
    fun createDatabase() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, FocusLockDatabase::class.java)
            .allowMainThreadQueries()
            .build()
    }

    @After
    fun closeDatabase() {
        db.close()
    }

    @Test
    fun appLimits_areStoredIndependentlyPerApp() = runBlocking {
        val dao = db.appLimitDao()
        dao.upsert(AppLimitEntity("com.instagram.android", 30))
        dao.upsert(AppLimitEntity("com.google.android.youtube", 60))
        dao.upsert(AppLimitEntity("com.android.chrome", 45))

        assertEquals(3, dao.getAll().size)
        assertEquals(30, dao.getForPackage("com.instagram.android")?.dailyLimitMinutes)
        assertEquals(60, dao.getForPackage("com.google.android.youtube")?.dailyLimitMinutes)

        // Editing one app's limit must not affect the others.
        dao.upsert(AppLimitEntity("com.instagram.android", 15))
        assertEquals(15, dao.getForPackage("com.instagram.android")?.dailyLimitMinutes)
        assertEquals(45, dao.getForPackage("com.android.chrome")?.dailyLimitMinutes)

        dao.deleteForPackage("com.android.chrome")
        assertNull(dao.getForPackage("com.android.chrome"))
        assertEquals(2, dao.getAll().size)
    }

    @Test
    fun blockedAttempts_incrementAndKeepFirstBlockedTime() = runBlocking {
        val dao = db.dailyUsageDao()
        dao.incrementBlockedAttempts("com.example.app", "2024-01-15", 1_000L)
        dao.incrementBlockedAttempts("com.example.app", "2024-01-15", 2_000L)
        dao.incrementBlockedAttempts("com.example.app", "2024-01-16", 3_000L)

        val day1 = dao.getForPackageDate("com.example.app", "2024-01-15")
        assertEquals(2, day1?.blockedAttempts)
        assertEquals(1_000L, day1?.firstBlockedAtMillis)

        val day2 = dao.getForPackageDate("com.example.app", "2024-01-16")
        assertEquals(1, day2?.blockedAttempts)
        assertEquals(3_000L, day2?.firstBlockedAtMillis)
    }

    @Test
    fun emergencyState_roundTripsAndFindsActiveRow() = runBlocking {
        val dao = db.emergencyDao()
        dao.upsert(
            EmergencyStateEntity(
                date = "2024-01-15",
                sessionsUsed = 1,
                activePackage = "com.example.app",
                activeStartWallMillis = 10_000L,
                activeEndWallMillis = 610_000L
            )
        )
        dao.upsert(EmergencyStateEntity(date = "2024-01-16", sessionsUsed = 0))

        // The active session lives on yesterday's row (crossed midnight).
        val active = dao.getActiveRow()
        assertEquals("2024-01-15", active?.date)
        assertEquals("com.example.app", active?.activePackage)
        assertEquals("2024-01-16", dao.getLatest()?.date)
    }

    @Test
    fun usageOffset_isStoredPerDay() = runBlocking {
        val dao = db.dailyUsageDao()
        dao.setUsageOffset("com.example.app", "2024-01-15", 25L * 60_000L)
        assertEquals(
            25L * 60_000L,
            dao.getForPackageDate("com.example.app", "2024-01-15")?.usageOffsetMillis
        )
        // Next day starts clean (offset is per-date by design).
        assertNull(dao.getForPackageDate("com.example.app", "2024-01-16"))
    }
}
