package `in`.focuslife.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits WHERE isActive = 1 ORDER BY sortOrder ASC")
    fun observeActive(): Flow<List<Habit>>

    @Query("SELECT * FROM habits ORDER BY sortOrder ASC")
    suspend fun getAll(): List<Habit>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(habits: List<Habit>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(habit: Habit): Long

    @Update
    suspend fun update(habit: Habit)
}

@Dao
interface HabitLogDao {
    @Query("SELECT * FROM habit_logs WHERE date = :date")
    fun observeByDate(date: String): Flow<List<HabitLog>>

    @Query("SELECT * FROM habit_logs WHERE date = :date")
    suspend fun getByDate(date: String): List<HabitLog>

    @Query("SELECT * FROM habit_logs WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    fun observeRange(from: String, to: String): Flow<List<HabitLog>>

    @Query("SELECT * FROM habit_logs WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    suspend fun getRange(from: String, to: String): List<HabitLog>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: HabitLog): Long

    @Query("UPDATE habit_logs SET completed = :completed WHERE habitId = :habitId AND date = :date")
    suspend fun setCompleted(habitId: Int, date: String, completed: Boolean)

    @Query("DELETE FROM habit_logs WHERE habitId = :habitId AND date = :date")
    suspend fun deleteLog(habitId: Int, date: String)
}

@Dao
interface StudyTaskDao {
    @Query("SELECT * FROM study_tasks WHERE date = :date ORDER BY id ASC")
    fun observeByDate(date: String): Flow<List<StudyTask>>

    @Query("SELECT * FROM study_tasks WHERE date = :date ORDER BY id ASC")
    suspend fun getByDate(date: String): List<StudyTask>

    @Query("SELECT * FROM study_tasks WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    fun observeRange(from: String, to: String): Flow<List<StudyTask>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: StudyTask): Long

    @Update
    suspend fun update(task: StudyTask)

    @Query("DELETE FROM study_tasks WHERE id = :id")
    suspend fun delete(id: Int)

    @Query("SELECT COUNT(*) FROM study_tasks WHERE date = :date AND completed = 1")
    suspend fun countCompleted(date: String): Int

    @Query("SELECT COUNT(*) FROM study_tasks WHERE date = :date")
    suspend fun countTotal(date: String): Int
}

@Dao
interface FocusSessionDao {
    @Query("SELECT * FROM focus_sessions WHERE date = :date ORDER BY startedAt DESC")
    fun observeByDate(date: String): Flow<List<FocusSession>>

    @Query("SELECT * FROM focus_sessions WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    fun observeRange(from: String, to: String): Flow<List<FocusSession>>

    @Query("SELECT COALESCE(SUM(actualMinutes),0) FROM focus_sessions WHERE date = :date AND completed = 1")
    suspend fun sumMinutes(date: String): Int

    @Query("SELECT COUNT(*) FROM focus_sessions WHERE date = :date AND completed = 1")
    suspend fun countCompleted(date: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: FocusSession): Long
}

@Dao
interface FitnessLogDao {
    @Query("SELECT * FROM fitness_logs WHERE date = :date LIMIT 1")
    fun observeByDate(date: String): Flow<FitnessLog?>

    @Query("SELECT * FROM fitness_logs WHERE date = :date LIMIT 1")
    suspend fun getByDate(date: String): FitnessLog?

    @Query("SELECT * FROM fitness_logs WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    fun observeRange(from: String, to: String): Flow<List<FitnessLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: FitnessLog): Long

    @Update
    suspend fun update(log: FitnessLog)
}

@Dao
interface RoutineSlotDao {
    @Query("SELECT * FROM routine_slots ORDER BY time ASC")
    fun observeAll(): Flow<List<RoutineSlot>>

    @Query("SELECT * FROM routine_slots ORDER BY time ASC")
    suspend fun getAll(): List<RoutineSlot>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(slots: List<RoutineSlot>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(slot: RoutineSlot): Long

    @Update
    suspend fun update(slot: RoutineSlot)

    @Query("DELETE FROM routine_slots WHERE id = :id")
    suspend fun delete(id: Int)
}

@Dao
interface DistractionDao {
    @Query("SELECT * FROM distraction_entries ORDER BY date DESC, id DESC LIMIT 100")
    fun observeRecent(): Flow<List<DistractionEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: DistractionEntry): Long
}

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals ORDER BY completed ASC, id ASC")
    fun observeAll(): Flow<List<Goal>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(goal: Goal): Long

    @Update
    suspend fun update(goal: Goal)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun delete(id: Int)
}

@Dao
interface VisionDao {
    @Query("SELECT * FROM vision_items ORDER BY sortOrder ASC")
    fun observeAll(): Flow<List<VisionItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: VisionItem): Long

    @Query("DELETE FROM vision_items WHERE id = :id")
    suspend fun delete(id: Int)
}
