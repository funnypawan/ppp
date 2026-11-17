package `in`.focuslife.app.data

import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class Repository(
    private val db: AppDatabase,
    val prefs: PreferencesManager
) {
    fun today(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    fun weekRange(): Pair<String, String> {
        val today = LocalDate.now()
        val monday = today.minusDays((today.dayOfWeek.value - 1).toLong())
        return monday.format(DateTimeFormatter.ISO_LOCAL_DATE) to today.format(DateTimeFormatter.ISO_LOCAL_DATE)
    }

    // Habits
    fun observeHabits(): Flow<List<Habit>> = db.habitDao().observeActive()
    fun observeHabitLogs(date: String): Flow<List<HabitLog>> = db.habitLogDao().observeByDate(date)
    suspend fun setHabitCompleted(habitId: Int, date: String, completed: Boolean) {
        if (completed) {
            db.habitLogDao().setCompleted(habitId, date, true)
            val existing = db.habitLogDao().getByDate(date).firstOrNull { it.habitId == habitId }
            if (existing == null) db.habitLogDao().insert(HabitLog(habitId = habitId, date = date, completed = true))
        } else {
            db.habitLogDao().deleteLog(habitId, date)
        }
    }

    // Study
    fun observeStudyTasks(date: String): Flow<List<StudyTask>> = db.studyTaskDao().observeByDate(date)
    suspend fun addStudyTask(title: String, subject: String, chapter: String, targetMinutes: Int, date: String, exam: String) {
        db.studyTaskDao().insert(StudyTask(title = title, subject = subject, chapter = chapter, targetMinutes = targetMinutes, date = date, exam = exam))
    }
    suspend fun toggleStudyTask(task: StudyTask) {
        db.studyTaskDao().update(task.copy(completed = !task.completed))
    }
    suspend fun deleteStudyTask(id: Int) = db.studyTaskDao().delete(id)

    // Focus
    fun observeFocusSessions(date: String): Flow<List<FocusSession>> = db.focusSessionDao().observeByDate(date)
    suspend fun addFocusSession(session: FocusSession) = db.focusSessionDao().insert(session)

    // Fitness
    fun observeFitness(date: String): Flow<FitnessLog?> = db.fitnessLogDao().observeByDate(date)
    suspend fun saveFitness(log: FitnessLog) {
        val existing = db.fitnessLogDao().getByDate(log.date)
        if (existing == null) db.fitnessLogDao().insert(log) else db.fitnessLogDao().update(log.copy(id = existing.id))
    }

    // Routine
    fun observeRoutine(): Flow<List<RoutineSlot>> = db.routineSlotDao().observeAll()
    suspend fun updateRoutine(slot: RoutineSlot) = db.routineSlotDao().update(slot)
    suspend fun addRoutine(slot: RoutineSlot) = db.routineSlotDao().insert(slot)
    suspend fun deleteRoutine(id: Int) = db.routineSlotDao().delete(id)

    // Distraction
    fun observeDistractions(): Flow<List<DistractionEntry>> = db.distractionDao().observeRecent()
    suspend fun addDistraction(entry: DistractionEntry) = db.distractionDao().insert(entry)

    // Goals / Vision
    fun observeGoals(): Flow<List<Goal>> = db.goalDao().observeAll()
    suspend fun addGoal(goal: Goal) = db.goalDao().insert(goal)
    suspend fun updateGoal(goal: Goal) = db.goalDao().update(goal)
    suspend fun deleteGoal(id: Int) = db.goalDao().delete(id)

    fun observeVision(): Flow<List<VisionItem>> = db.visionDao().observeAll()
    suspend fun addVision(text: String) = db.visionDao().insert(VisionItem(text = text))
    suspend fun deleteVision(id: Int) = db.visionDao().delete(id)

    suspend fun dayStats(date: String): DayStats {
        val tasks = db.studyTaskDao().getByDate(date)
        val logs = db.habitLogDao().getByDate(date)
        val fitness = db.fitnessLogDao().getByDate(date)
        val focusMin = db.focusSessionDao().sumMinutes(date)
        val focusCount = db.focusSessionDao().countCompleted(date)
        val studyMin = tasks.filter { it.completed }.sumOf { it.targetMinutes }
        return DayStats(
            date = date,
            studyMinutes = studyMin,
            focusMinutes = focusMin,
            tasksCompleted = tasks.count { it.completed },
            tasksTotal = tasks.size,
            habitsCompleted = logs.count { it.completed },
            habitsTotal = 10,
            runningMinutes = fitness?.runningMinutes ?: 0,
            distanceMeters = fitness?.distanceMeters ?: 0,
            focusSessions = focusCount
        )
    }

    suspend fun weekStats(): List<DayStats> {
        val (from, to) = weekRange()
        val dates = mutableListOf<String>()
        var d = LocalDate.parse(from)
        val end = LocalDate.parse(to)
        while (!d.isAfter(end)) {
            dates.add(d.format(DateTimeFormatter.ISO_LOCAL_DATE))
            d = d.plusDays(1)
        }
        return dates.map { dayStats(it) }
    }

    suspend fun streak(): Int {
        var streak = 0
        var date = LocalDate.now()
        // If today has no progress yet, start from yesterday
        val todayStats = dayStats(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
        if (todayStats.tasksCompleted == 0 && todayStats.habitsCompleted == 0 && todayStats.focusSessions == 0) {
            date = date.minusDays(1)
        }
        while (true) {
            val s = dayStats(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
            val hasProgress = s.tasksCompleted > 0 || s.habitsCompleted >= 3 || s.focusSessions > 0 || s.runningMinutes > 0
            if (hasProgress) {
                streak++
                date = date.minusDays(1)
            } else break
        }
        return streak
    }

    suspend fun focusScore(date: String): Int {
        val s = dayStats(date)
        var score = 0
        if (s.tasksTotal > 0) score += (s.tasksCompleted * 100 / s.tasksTotal) / 4 // 25 pts
        score += minOf(25, s.habitsCompleted * 3) // 25 pts
        score += minOf(25, s.focusMinutes / 4) // 25 pts (100 min = 25)
        score += minOf(25, s.runningMinutes / 2) // 25 pts (50 min = 25)
        return score.coerceIn(0, 100)
    }
}
