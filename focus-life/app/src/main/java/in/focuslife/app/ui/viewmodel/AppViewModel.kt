package `in`.focuslife.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import `in`.focuslife.app.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getInstance(application)
    private val repo = Repository(db, PreferencesManager(application))
    val prefs = PreferencesManager(application)

    val today = repo.today()

    val habits: StateFlow<List<Habit>> = repo.observeHabits().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val habitLogs: StateFlow<List<HabitLog>> = repo.observeHabitLogs(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val studyTasks: StateFlow<List<StudyTask>> = repo.observeStudyTasks(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val focusSessions: StateFlow<List<FocusSession>> = repo.observeFocusSessions(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val fitness: StateFlow<FitnessLog?> = repo.observeFitness(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    val routine: StateFlow<List<RoutineSlot>> = repo.observeRoutine().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val distractions: StateFlow<List<DistractionEntry>> = repo.observeDistractions().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val goals: StateFlow<List<Goal>> = repo.observeGoals().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val vision: StateFlow<List<VisionItem>> = repo.observeVision().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val userName: StateFlow<String> = prefs.userName.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")
    val language: StateFlow<String> = prefs.language.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "en")
    val blockedApps: StateFlow<Set<String>> = prefs.blockedApps.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())
    val activeMode: StateFlow<String> = prefs.activeMode.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "none")
    val dailyScreenLimit: StateFlow<Int> = prefs.dailyScreenLimitMin.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 180)
    val runningTarget: StateFlow<Int> = prefs.runningTargetM.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 1600)
    val remindersEnabled: StateFlow<Boolean> = prefs.remindersEnabled.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)
    val personalReasons: StateFlow<String> = prefs.personalReasons.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")
    val focusTask: StateFlow<String> = prefs.focusTask.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    private val _dayStats = MutableStateFlow<DayStats?>(null)
    val dayStats: StateFlow<DayStats?> = _dayStats.asStateFlow()

    private val _weekStats = MutableStateFlow<List<DayStats>>(emptyList())
    val weekStats: StateFlow<List<DayStats>> = _weekStats.asStateFlow()

    private val _streak = MutableStateFlow(0)
    val streak: StateFlow<Int> = _streak.asStateFlow()

    private val _focusScore = MutableStateFlow(0)
    val focusScore: StateFlow<Int> = _focusScore.asStateFlow()

    private val _usage = MutableStateFlow<List<AppUsage>>(emptyList())
    val usage: StateFlow<List<AppUsage>> = _usage.asStateFlow()

    private val _totalScreenMs = MutableStateFlow(0L)
    val totalScreenMs: StateFlow<Long> = _totalScreenMs.asStateFlow()

    fun refreshAll() {
        viewModelScope.launch {
            _dayStats.value = repo.dayStats(today)
            _weekStats.value = repo.weekStats()
            _streak.value = repo.streak()
            _focusScore.value = repo.focusScore(today)
        }
    }

    fun refreshUsage() {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            val list = UsageHelper.queryTodayUsage(getApplication())
            _usage.value = list
            _totalScreenMs.value = list.sumOf { it.foregroundMs }
        }
    }

    fun setHabitCompleted(habitId: Int, completed: Boolean) {
        viewModelScope.launch { repo.setHabitCompleted(habitId, today, completed); refreshAll() }
    }

    fun addStudyTask(title: String, subject: String, chapter: String, targetMinutes: Int, exam: String) {
        viewModelScope.launch { repo.addStudyTask(title, subject, chapter, targetMinutes, today, exam); refreshAll() }
    }

    fun toggleStudyTask(task: StudyTask) {
        viewModelScope.launch { repo.toggleStudyTask(task); refreshAll() }
    }

    fun deleteStudyTask(id: Int) {
        viewModelScope.launch { repo.deleteStudyTask(id); refreshAll() }
    }

    fun addFocusSession(taskTitle: String, plannedMinutes: Int, actualMinutes: Int, mode: String) {
        viewModelScope.launch {
            repo.addFocusSession(
                FocusSession(
                    date = today,
                    taskTitle = taskTitle,
                    plannedMinutes = plannedMinutes,
                    actualMinutes = actualMinutes,
                    completed = true,
                    mode = mode,
                    startedAt = System.currentTimeMillis()
                )
            )
            refreshAll()
        }
    }

    fun saveFitness(log: FitnessLog) {
        viewModelScope.launch { repo.saveFitness(log); refreshAll() }
    }

    fun updateRoutine(slot: RoutineSlot) {
        viewModelScope.launch { repo.updateRoutine(slot) }
    }

    fun addRoutine(slot: RoutineSlot) {
        viewModelScope.launch { repo.addRoutine(slot) }
    }

    fun deleteRoutine(id: Int) {
        viewModelScope.launch { repo.deleteRoutine(id) }
    }

    fun addDistraction(trigger: String, what: String, reason: String, alternative: String) {
        viewModelScope.launch {
            repo.addDistraction(DistractionEntry(date = today, trigger = trigger, whatDistracted = what, reason = reason, alternativeUsed = alternative))
        }
    }

    fun addGoal(title: String, category: String) {
        viewModelScope.launch { repo.addGoal(Goal(title = title, category = category)) }
    }

    fun updateGoal(goal: Goal) {
        viewModelScope.launch { repo.updateGoal(goal) }
    }

    fun deleteGoal(id: Int) {
        viewModelScope.launch { repo.deleteGoal(id) }
    }

    fun addVision(text: String) {
        viewModelScope.launch { repo.addVision(text) }
    }

    fun deleteVision(id: Int) {
        viewModelScope.launch { repo.deleteVision(id) }
    }

    fun setUserName(name: String) = viewModelScope.launch { prefs.setUserName(name) }
    fun setLanguage(lang: String) = viewModelScope.launch { prefs.setLanguage(lang) }
    fun setBlockedApps(apps: Set<String>) = viewModelScope.launch { prefs.setBlockedApps(apps) }
    fun setActiveMode(mode: String) = viewModelScope.launch { prefs.setActiveMode(mode) }
    fun setDailyScreenLimit(min: Int) = viewModelScope.launch { prefs.setDailyScreenLimit(min) }
    fun setRunningTarget(m: Int) = viewModelScope.launch { prefs.setRunningTarget(m) }
    fun setRemindersEnabled(enabled: Boolean) = viewModelScope.launch { prefs.setRemindersEnabled(enabled) }
    fun setPersonalReasons(text: String) = viewModelScope.launch { prefs.setPersonalReasons(text) }
    fun setFocusTask(task: String) = viewModelScope.launch { prefs.setFocusTask(task) }
}
