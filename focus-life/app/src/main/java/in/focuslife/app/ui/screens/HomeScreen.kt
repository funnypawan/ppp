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
import `in`.focuslife.app.data.Quotes
import `in`.focuslife.app.data.UsageHelper
import `in`.focuslife.app.ui.components.ProgressCircle
import `in`.focuslife.app.ui.components.StatCard
import `in`.focuslife.app.ui.viewmodel.AppViewModel

@Composable
fun HomeScreen(viewModel: AppViewModel, onOpenFocus: () -> Unit, onOpenStudy: () -> Unit) {
    val stats by viewModel.dayStats.collectAsState()
    val score by viewModel.focusScore.collectAsState()
    val streak by viewModel.streak.collectAsState()
    val totalScreenMs by viewModel.totalScreenMs.collectAsState()
    val language by viewModel.language.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val fitness by viewModel.fitness.collectAsState()
    val goals by viewModel.goals.collectAsState()
    val routine by viewModel.routine.collectAsState()

    val dailyProgress = when {
        stats == null -> 0f
        else -> {
            val s = stats!!
            val parts = mutableListOf<Float>()
            if (s.tasksTotal > 0) parts.add(s.tasksCompleted.toFloat() / s.tasksTotal)
            if (s.habitsTotal > 0) parts.add(s.habitsCompleted.toFloat() / s.habitsTotal)
            parts.add(minOf(1f, s.focusMinutes / 100f))
            parts.add(minOf(1f, s.runningMinutes / 30f))
            if (parts.isEmpty()) 0f else parts.average().toFloat()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = if (userName.isNotBlank()) "Namaste, $userName 🙏" else "Namaste 🙏",
                style = MaterialTheme.typography.headlineSmall
            )
            Text(
                text = stringResource(R.string.app_tagline),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = stringResource(R.string.home_daily_progress), style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    ProgressCircle(progress = dailyProgress, label = stringResource(R.string.home_daily_progress))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = Quotes.dailyQuote(viewModel.today, language == "hi"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = stringResource(R.string.home_today_focus_score),
                    value = "$score/100",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = stringResource(R.string.home_streak),
                    value = "$streak days",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = stringResource(R.string.home_completed_tasks),
                    value = "${stats?.tasksCompleted ?: 0}/${stats?.tasksTotal ?: 0}",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = stringResource(R.string.home_study_time),
                    value = "${stats?.studyMinutes ?: 0} min",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = stringResource(R.string.home_focus_time),
                    value = "${stats?.focusMinutes ?: 0} min",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = stringResource(R.string.home_screen_time),
                    value = UsageHelper.formatDuration(totalScreenMs),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = stringResource(R.string.home_running),
                    value = "${fitness?.distanceMeters ?: 0} m",
                    subtitle = "${fitness?.runningMinutes ?: 0} min",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = stringResource(R.string.home_exercise),
                    value = if (fitness?.exerciseDone == true) "Done ✓" else "Pending",
                    subtitle = "Pull-ups: ${fitness?.pullUps ?: 0}",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            val remaining = goals.count { !it.completed }
            StatCard(
                title = stringResource(R.string.home_remaining_goals),
                value = "$remaining goals",
                subtitle = if (goals.isEmpty()) "Add goals in Profile → Motivation" else goals.firstOrNull { !it.completed }?.title ?: "All goals complete 🎉",
                modifier = Modifier.fillMaxWidth()
            )
        }

        item {
            Text(text = "Today's Routine", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))
            if (routine.isEmpty()) {
                Text(text = "No routine slots", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                routine.take(5).forEach { slot ->
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Text(text = slot.time, modifier = Modifier.weight(0.3f), style = MaterialTheme.typography.bodyMedium)
                        Text(text = slot.title, modifier = Modifier.weight(0.7f), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                Button(onClick = onOpenFocus, modifier = Modifier.weight(1f)) { Text("Start Focus") }
                OutlinedButton(onClick = onOpenStudy, modifier = Modifier.weight(1f)) { Text("Study Plan") }
            }
        }
    }
}
