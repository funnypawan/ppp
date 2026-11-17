package `in`.focuslife.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        Habit::class,
        HabitLog::class,
        StudyTask::class,
        FocusSession::class,
        FitnessLog::class,
        RoutineSlot::class,
        DistractionEntry::class,
        Goal::class,
        VisionItem::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun habitDao(): HabitDao
    abstract fun habitLogDao(): HabitLogDao
    abstract fun studyTaskDao(): StudyTaskDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun fitnessLogDao(): FitnessLogDao
    abstract fun routineSlotDao(): RoutineSlotDao
    abstract fun distractionDao(): DistractionDao
    abstract fun goalDao(): GoalDao
    abstract fun visionDao(): VisionDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "focuslife.db"
                ).addCallback(SeedCallback(context)).build()
                INSTANCE = instance
                instance
            }
        }

        private class SeedCallback(private val appContext: Context) : Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                CoroutineScope(Dispatchers.IO).launch {
                    val database = getInstance(appContext)
                    if (database.habitDao().getAll().isEmpty()) {
                        database.habitDao().insertAll(DefaultData.defaultHabits)
                    }
                    if (database.routineSlotDao().getAll().isEmpty()) {
                        database.routineSlotDao().insertAll(DefaultData.defaultRoutine)
                    }
                }
            }
        }
    }
}
