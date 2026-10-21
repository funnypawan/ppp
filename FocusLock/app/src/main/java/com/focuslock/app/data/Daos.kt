package com.focuslock.app.data

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface AppLimitDao {

    @Query("SELECT * FROM app_limits")
    suspend fun getAll(): List<AppLimitEntity>

    @Query("SELECT * FROM app_limits")
    fun observeAll(): Flow<List<AppLimitEntity>>

    @Query("SELECT * FROM app_limits WHERE packageName = :pkg")
    suspend fun getForPackage(pkg: String): AppLimitEntity?

    @Upsert
    suspend fun upsert(limit: AppLimitEntity)

    @Query("DELETE FROM app_limits WHERE packageName = :pkg")
    suspend fun deleteForPackage(pkg: String)

    @Query("DELETE FROM app_limits")
    suspend fun deleteAll()

    /** Used by settings import. */
    @Transaction
    suspend fun replaceAll(limits: List<AppLimitEntity>) {
        deleteAll()
        for (limit in limits) upsert(limit)
    }
}

@Dao
interface DailyUsageDao {

    @Query("SELECT * FROM daily_usage WHERE date = :date")
    suspend fun getForDate(date: String): List<DailyUsageEntity>

    @Query("SELECT * FROM daily_usage WHERE date = :date AND packageName = :pkg")
    suspend fun getForPackageDate(pkg: String, date: String): DailyUsageEntity?

    @Query("SELECT * FROM daily_usage WHERE date >= :fromDate AND date <= :toDate")
    suspend fun getRange(fromDate: String, toDate: String): List<DailyUsageEntity>

    @Upsert
    suspend fun upsert(row: DailyUsageEntity)

    @Query("DELETE FROM daily_usage WHERE date < :beforeDate")
    suspend fun deleteOlderThan(beforeDate: String)

    @Transaction
    suspend fun incrementBlockedAttempts(pkg: String, date: String, nowMillis: Long) {
        val existing = getForPackageDate(pkg, date)
        if (existing == null) {
            upsert(
                DailyUsageEntity(
                    packageName = pkg, date = date,
                    blockedAttempts = 1, firstBlockedAtMillis = nowMillis
                )
            )
        } else {
            upsert(
                existing.copy(
                    blockedAttempts = existing.blockedAttempts + 1,
                    firstBlockedAtMillis =
                        if (existing.firstBlockedAtMillis == 0L) nowMillis
                        else existing.firstBlockedAtMillis
                )
            )
        }
    }

    @Transaction
    suspend fun addEmergencyMillis(pkg: String, date: String, millis: Long) {
        if (millis <= 0L) return
        val existing = getForPackageDate(pkg, date)
        if (existing == null) {
            upsert(DailyUsageEntity(packageName = pkg, date = date, emergencyMillisUsed = millis))
        } else {
            upsert(existing.copy(emergencyMillisUsed = existing.emergencyMillisUsed + millis))
        }
    }

    /** "Reset today's counted usage": future checks subtract this baseline. */
    @Transaction
    suspend fun setUsageOffset(pkg: String, date: String, offsetMillis: Long) {
        val existing = getForPackageDate(pkg, date)
        if (existing == null) {
            upsert(DailyUsageEntity(packageName = pkg, date = date, usageOffsetMillis = offsetMillis))
        } else {
            upsert(existing.copy(usageOffsetMillis = offsetMillis))
        }
    }

    /** Stores a system-usage snapshot for statistics/history. */
    @Transaction
    suspend fun snapshotUsage(pkg: String, date: String, usageMillis: Long) {
        val existing = getForPackageDate(pkg, date)
        if (existing == null) {
            upsert(DailyUsageEntity(packageName = pkg, date = date, usageMillis = usageMillis))
        } else if (existing.usageMillis != usageMillis) {
            upsert(existing.copy(usageMillis = usageMillis))
        }
    }
}

@Dao
interface EmergencyDao {

    @Query("SELECT * FROM emergency_state WHERE date = :date")
    suspend fun getForDate(date: String): EmergencyStateEntity?

    @Query("SELECT * FROM emergency_state WHERE date = :date")
    fun observeForDate(date: String): Flow<EmergencyStateEntity?>

    /** Most recent day-row; needed when a session runs across midnight. */
    @Query("SELECT * FROM emergency_state ORDER BY date DESC LIMIT 1")
    suspend fun getLatest(): EmergencyStateEntity?

    /** The row holding the currently active session (today's or yesterday's). */
    @Query("SELECT * FROM emergency_state WHERE activePackage IS NOT NULL ORDER BY date DESC LIMIT 1")
    suspend fun getActiveRow(): EmergencyStateEntity?

    @Upsert
    suspend fun upsert(state: EmergencyStateEntity)

    @Query("DELETE FROM emergency_state WHERE date < :beforeDate")
    suspend fun deleteOlderThan(beforeDate: String)
}
