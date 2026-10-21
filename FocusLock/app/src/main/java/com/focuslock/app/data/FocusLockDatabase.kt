package com.focuslock.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * Single local database. Everything (limits, daily records, emergency
 * counters) lives only on the device — FocusLock has no backend.
 */
@Database(
    entities = [
        AppLimitEntity::class,
        DailyUsageEntity::class,
        EmergencyStateEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class FocusLockDatabase : RoomDatabase() {

    abstract fun appLimitDao(): AppLimitDao
    abstract fun dailyUsageDao(): DailyUsageDao
    abstract fun emergencyDao(): EmergencyDao

    companion object {
        const val DATABASE_NAME = "focuslock.db"

        @Volatile
        private var INSTANCE: FocusLockDatabase? = null

        fun getInstance(context: Context): FocusLockDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    FocusLockDatabase::class.java,
                    DATABASE_NAME
                )
                    // v1: if a future schema change ships without a migration,
                    // recreating empty tables is safer than crashing.
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
