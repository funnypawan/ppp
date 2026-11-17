package `in`.focuslife.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import `in`.focuslife.app.R
import `in`.focuslife.app.ui.components.SectionTitle
import `in`.focuslife.app.ui.viewmodel.AppViewModel

@Composable
fun HabitsScreen(viewModel: AppViewModel) {
    val habits by viewModel.habits.collectAsState()
    val logs by viewModel.habitLogs.collectAsState()
    val language by viewModel.language.collectAsState()
    val weekStats by viewModel.weekStats.collectAsState()
    val streak by viewModel.streak.collectAsState()

    val completedIds = logs.filter { it.completed }.map { it.habitId }.toSet()
    val percent = if (habits.isEmpty()) 0 else (completedIds.size * 100 / habits.size)

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = stringResource(R.string.habits_title), style = MaterialTheme.typography.headlineSmall)
            Text(text = "Streak: $streak days • Today: $percent% complete", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(progress = { percent / 100f }, modifier = Modifier.fillMaxWidth())
        }

        item {
            SectionTitle("Today's Checklist")
            Spacer(Modifier.height(8.dp))
            habits.forEach { habit ->
                val done = habit.id in completedIds
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = done, onCheckedChange = { viewModel.setHabitCompleted(habit.id, it) })
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (language == "hi" && habit.nameHi.isNotBlank()) habit.nameHi else habit.name,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(text = habit.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (done) Text(text = "✓", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Missing a habit today? No problem — consistency matters more than perfection. Try again tomorrow.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            SectionTitle("Weekly Calendar")
            Spacer(Modifier.height(8.dp))
            weekStats.forEach { day ->
                val dayPercent = if (day.habitsTotal > 0) day.habitsCompleted * 100 / day.habitsTotal else 0
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(text = day.date, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                    Text(text = "${day.habitsCompleted}/${day.habitsTotal}", style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.width(8.dp))
                    LinearProgressIndicator(progress = { dayPercent / 100f }, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(8.dp))
                    Text(text = "$dayPercent%", style = MaterialTheme.typography.bodySmall)
                }
            }
        }

        item {
            SectionTitle("Missed Habit Analysis (This Week)")
            Spacer(Modifier.height(8.dp))
            val totalPossible = weekStats.sumOf { it.habitsTotal }
            val totalDone = weekStats.sumOf { it.habitsCompleted }
            val missed = totalPossible - totalDone
            Text(
                text = "Completed $totalDone of $totalPossible habit checks this week. Missed: $missed.",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "Focus on one missed habit at a time. Small progress is still progress.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
