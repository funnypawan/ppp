package `in`.focuslife.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "habits")
data class Habit(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val nameHi: String = "",
    val category: String = "general",
    val sortOrder: Int = 0,
    val isActive: Boolean = true
)

@Entity(tableName = "habit_logs")
data class HabitLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val habitId: Int,
    val date: String, // yyyy-MM-dd
    val completed: Boolean = false,
    val note: String = ""
)

@Entity(tableName = "study_tasks")
data class StudyTask(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val subject: String,
    val chapter: String = "",
    val targetMinutes: Int = 60,
    val date: String,
    val completed: Boolean = false,
    val exam: String = "Railway ALP"
)

@Entity(tableName = "focus_sessions")
data class FocusSession(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val date: String,
    val taskTitle: String,
    val plannedMinutes: Int,
    val actualMinutes: Int,
    val completed: Boolean,
    val mode: String = "deep_focus",
    val startedAt: Long = 0L
)

@Entity(tableName = "fitness_logs")
data class FitnessLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val date: String,
    val runningMinutes: Int = 0,
    val distanceMeters: Int = 0,
    val runningTimeSeconds: Int = 0, // for 1600m
    val pullUps: Int = 0,
    val exerciseDone: Boolean = false,
    val isRestDay: Boolean = false,
    val note: String = ""
)

@Entity(tableName = "routine_slots")
data class RoutineSlot(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val time: String, // HH:mm 24h
    val title: String,
    val titleHi: String = "",
    val enabled: Boolean = true,
    val sortOrder: Int = 0
)

@Entity(tableName = "distraction_entries")
data class DistractionEntry(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val date: String,
    val trigger: String,
    val whatDistracted: String,
    val reason: String = "",
    val alternativeUsed: String = ""
)

@Entity(tableName = "goals")
data class Goal(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val category: String = "general",
    val targetDate: String = "",
    val completed: Boolean = false,
    val progress: Int = 0 // 0-100
)

@Entity(tableName = "vision_items")
data class VisionItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val text: String,
    val sortOrder: Int = 0
)

data class DayStats(
    val date: String,
    val studyMinutes: Int,
    val focusMinutes: Int,
    val tasksCompleted: Int,
    val tasksTotal: Int,
    val habitsCompleted: Int,
    val habitsTotal: Int,
    val runningMinutes: Int,
    val distanceMeters: Int,
    val focusSessions: Int
)

object DefaultData {
    val defaultHabits = listOf(
        Habit(name = "Wake up on time", nameHi = "समय पर उठना", category = "discipline", sortOrder = 1),
        Habit(name = "Morning exercise", nameHi = "सुबह का व्यायाम", category = "fitness", sortOrder = 2),
        Habit(name = "Running", nameHi = "दौड़", category = "fitness", sortOrder = 3),
        Habit(name = "Study Mathematics", nameHi = "गणित पढ़ना", category = "study", sortOrder = 4),
        Habit(name = "Study Biology", nameHi = "जीव विज्ञान पढ़ना", category = "study", sortOrder = 5),
        Habit(name = "Study Reasoning", nameHi = "रीजनिंग पढ़ना", category = "study", sortOrder = 6),
        Habit(name = "Avoid unnecessary mobile usage", nameHi = "अनावश्यक मोबाइल उपयोग से बचना", category = "focus", sortOrder = 7),
        Habit(name = "Avoid unnecessary gaming", nameHi = "अनावश्यक गेमिंग से बचना", category = "focus", sortOrder = 8),
        Habit(name = "Read books", nameHi = "किताबें पढ़ना", category = "growth", sortOrder = 9),
        Habit(name = "Sleep on time", nameHi = "समय पर सोना", category = "discipline", sortOrder = 10)
    )

    val defaultRoutine = listOf(
        RoutineSlot(time = "04:30", title = "Wake up", titleHi = "उठना", sortOrder = 1),
        RoutineSlot(time = "05:00", title = "Running", titleHi = "दौड़", sortOrder = 2),
        RoutineSlot(time = "06:30", title = "Freshen up and breakfast", titleHi = "तैयार होना और नाश्ता", sortOrder = 3),
        RoutineSlot(time = "08:00", title = "Mathematics", titleHi = "गणित", sortOrder = 4),
        RoutineSlot(time = "09:00", title = "Biology", titleHi = "जीव विज्ञान", sortOrder = 5),
        RoutineSlot(time = "10:00", title = "Reasoning", titleHi = "रीजनिंग", sortOrder = 6),
        RoutineSlot(time = "11:00", title = "Revision", titleHi = "दोहराव", sortOrder = 7),
        RoutineSlot(time = "12:00", title = "Lunch and rest", titleHi = "दोपहर का भोजन और आराम", sortOrder = 8),
        RoutineSlot(time = "15:00", title = "General Knowledge", titleHi = "सामान्य ज्ञान", sortOrder = 9),
        RoutineSlot(time = "17:00", title = "Exercise", titleHi = "व्यायाम", sortOrder = 10),
        RoutineSlot(time = "19:00", title = "Revision", titleHi = "दोहराव", sortOrder = 11),
        RoutineSlot(time = "20:00", title = "Plan tomorrow", titleHi = "कल की योजना", sortOrder = 12),
        RoutineSlot(time = "20:30", title = "Sleep preparation", titleHi = "सोने की तैयारी", sortOrder = 13)
    )

    val subjects = listOf("Mathematics", "Reasoning", "Biology", "Physics", "Chemistry", "General Knowledge")
    val exams = listOf("Railway ALP", "Railway Group D", "SSC CGL", "SSC GD")
    val modes = listOf("Study Mode", "Running Mode", "Sleep Mode", "Deep Focus Mode")
}
