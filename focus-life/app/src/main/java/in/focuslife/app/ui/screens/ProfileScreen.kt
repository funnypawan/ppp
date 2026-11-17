package `in`.focuslife.app.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import `in`.focuslife.app.R
import `in`.focuslife.app.data.FitnessLog
import `in`.focuslife.app.data.PermissionHelper
import `in`.focuslife.app.data.Quotes
import `in`.focuslife.app.data.UsageHelper
import `in`.focuslife.app.ui.components.SectionTitle
import `in`.focuslife.app.ui.viewmodel.AppViewModel

@Composable
fun ProfileScreen(viewModel: AppViewModel) {
    var name by remember { mutableStateOf("") }
    var goalTitle by remember { mutableStateOf("") }
    var visionText by remember { mutableStateOf("") }
    var runMinutes by remember { mutableStateOf("") }
    var distance by remember { mutableStateOf("") }
    var runTime by remember { mutableStateOf("") }
    var pullUps by remember { mutableStateOf("") }
    var exerciseDone by remember { mutableStateOf(false) }
    var restDay by remember { mutableStateOf(false) }

    val userName by viewModel.userName.collectAsState()
    val language by viewModel.language.collectAsState()
    val goals by viewModel.goals.collectAsState()
    val vision by viewModel.vision.collectAsState()
    val fitness by viewModel.fitness.collectAsState()
    val runningTarget by viewModel.runningTarget.collectAsState()
    val remindersEnabled by viewModel.remindersEnabled.collectAsState()
    val personalReasons by viewModel.personalReasons.collectAsState()
    var reasonsText by remember { mutableStateOf("") }
    val routine by viewModel.routine.collectAsState()
    val distractions by viewModel.distractions.collectAsState()
    val weekStats by viewModel.weekStats.collectAsState()
    val dayStats by viewModel.dayStats.collectAsState()
    val totalScreenMs by viewModel.totalScreenMs.collectAsState()

    val context = LocalContext.current
    var permissionRecheck by remember { mutableIntStateOf(0) }
    val permissionStatus = remember(permissionRecheck) { PermissionHelper.status(context) }

    LaunchedEffect(userName) { if (name.isBlank()) name = userName }
    LaunchedEffect(personalReasons) { if (reasonsText.isBlank()) reasonsText = personalReasons }
    LaunchedEffect(fitness) {
        if (fitness != null) {
            runMinutes = fitness!!.runningMinutes.toString()
            distance = fitness!!.distanceMeters.toString()
            runTime = fitness!!.runningTimeSeconds.toString()
            pullUps = fitness!!.pullUps.toString()
            exerciseDone = fitness!!.exerciseDone
            restDay = fitness!!.isRestDay
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Text(text = stringResource(R.string.profile_title), style = MaterialTheme.typography.headlineSmall)
        }

        item {
            SectionTitle("Profile")
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Your name") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = { viewModel.setUserName(name) }, modifier = Modifier.fillMaxWidth()) { Text("Save Name") }
            Spacer(Modifier.height(12.dp))
            Text(text = stringResource(R.string.language_title), style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = language == "en", onClick = { viewModel.setLanguage("en") }, label = { Text(stringResource(R.string.language_en)) })
                FilterChip(selected = language == "hi", onClick = { viewModel.setLanguage("hi") }, label = { Text(stringResource(R.string.language_hi)) })
            }
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = "Routine reminders", modifier = Modifier.weight(1f))
                Switch(checked = remindersEnabled, onCheckedChange = { viewModel.setRemindersEnabled(it) })
            }
        }

        item {
            SectionTitle("Permissions")
            Spacer(Modifier.height(8.dp))
            Text(
                text = "All permissions are optional. Deny any of them and the app keeps working with reduced features.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(8.dp))
            PermissionRow(
                name = "Notifications (reminders)",
                granted = permissionStatus.notifications,
                onFix = {
                    context.startActivity(
                        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                            .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                }
            )
            PermissionRow(
                name = "Usage Access (screen time)",
                granted = permissionStatus.usageAccess,
                onFix = { context.startActivity(UsageHelper.usageAccessIntent(context)) }
            )
            PermissionRow(
                name = "Accessibility (app blocker)",
                granted = permissionStatus.accessibility,
                onFix = {
                    context.startActivity(
                        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                }
            )
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = { permissionRecheck++ }, modifier = Modifier.fillMaxWidth()) {
                Text("Re-check Permissions")
            }
            Card(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
            ) {
                Text(
                    text = "Accessibility shows OFF / \"App was denied access\"? Sideloaded APKs are blocked by Android 13+ on purpose. Fix: App info → ⋮ (top-right) → Allow restricted settings → then enable FOCUS LIFE in Accessibility → Downloaded apps. (Only Accessibility is restricted — Notifications and Usage Access enable normally.)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }

        item {
            SectionTitle(stringResource(R.string.fitness_title))
            Spacer(Modifier.height(8.dp))
            Text(text = "1600m target: $runningTarget m", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = runMinutes, onValueChange = { runMinutes = it.filter(Char::isDigit) }, label = { Text("Run (min)") }, modifier = Modifier.weight(1f))
                OutlinedTextField(value = distance, onValueChange = { distance = it.filter(Char::isDigit) }, label = { Text("Distance (m)") }, modifier = Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = runTime, onValueChange = { runTime = it.filter(Char::isDigit) }, label = { Text("1600m time (sec)") }, modifier = Modifier.weight(1f))
                OutlinedTextField(value = pullUps, onValueChange = { pullUps = it.filter(Char::isDigit) }, label = { Text("Pull-ups") }, modifier = Modifier.weight(1f))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = exerciseDone, onCheckedChange = { exerciseDone = it })
                Text(text = "Exercise checklist done")
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = restDay, onCheckedChange = { restDay = it })
                Text(text = "Rest day")
            }
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    viewModel.saveFitness(
                        FitnessLog(
                            date = viewModel.today,
                            runningMinutes = runMinutes.toIntOrNull() ?: 0,
                            distanceMeters = distance.toIntOrNull() ?: 0,
                            runningTimeSeconds = runTime.toIntOrNull() ?: 0,
                            pullUps = pullUps.toIntOrNull() ?: 0,
                            exerciseDone = exerciseDone,
                            isRestDay = restDay
                        )
                    )
                },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Save Fitness Log") }
            Spacer(Modifier.height(8.dp))
            Text(text = "Running target (m): $runningTarget", style = MaterialTheme.typography.bodySmall)
            Slider(value = runningTarget.toFloat(), onValueChange = { viewModel.setRunningTarget(it.toInt()) }, valueRange = 800f..5000f, steps = 0)
            if (weekStats.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text(text = "Weekly fitness progress:", style = MaterialTheme.typography.bodySmall)
                weekStats.forEach { day ->
                    Text(text = "${day.date}: ${day.runningMinutes} min, ${day.distanceMeters} m", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        item {
            SectionTitle(stringResource(R.string.routine_title))
            Spacer(Modifier.height(8.dp))
            routine.forEach { slot ->
                var time by remember(slot.id) { mutableStateOf(slot.time) }
                var title by remember(slot.id) { mutableStateOf(slot.title) }
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(value = time, onValueChange = { time = it }, label = { Text("Time HH:mm") }, modifier = Modifier.weight(1f))
                            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Activity") }, modifier = Modifier.weight(2f))
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Switch(checked = slot.enabled, onCheckedChange = { viewModel.updateRoutine(slot.copy(enabled = it)) })
                            Text(text = "Enabled", modifier = Modifier.weight(1f))
                            OutlinedButton(onClick = { viewModel.updateRoutine(slot.copy(time = time, title = title)) }) { Text("Save") }
                            IconButton(onClick = { viewModel.deleteRoutine(slot.id) }) { Icon(Icons.Default.Delete, contentDescription = "Delete") }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            var newTime by remember { mutableStateOf("21:00") }
            var newTitle by remember { mutableStateOf("") }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = newTime, onValueChange = { newTime = it }, label = { Text("HH:mm") }, modifier = Modifier.weight(1f))
                OutlinedTextField(value = newTitle, onValueChange = { newTitle = it }, label = { Text("New activity") }, modifier = Modifier.weight(2f))
            }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = {
                    if (newTitle.isNotBlank()) {
                        viewModel.addRoutine(`in`.focuslife.app.data.RoutineSlot(time = newTime, title = newTitle))
                        newTitle = ""
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Add Routine Slot") }
        }

        item {
            SectionTitle(stringResource(R.string.control_title))
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = reasonsText, onValueChange = { reasonsText = it }, label = { Text("My reasons for avoiding distractions") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = { viewModel.setPersonalReasons(reasonsText) }, modifier = Modifier.fillMaxWidth()) { Text("Save Reasons") }
            Spacer(Modifier.height(12.dp))
            Text(text = "When distracted:", style = MaterialTheme.typography.bodyMedium)
            Text(text = "1. ${stringResource(R.string.control_put_phone)}", style = MaterialTheme.typography.bodyMedium)
            Text(text = "2. ${stringResource(R.string.control_drink_water)}", style = MaterialTheme.typography.bodyMedium)
            Text(text = "3. ${stringResource(R.string.control_walk)}", style = MaterialTheme.typography.bodyMedium)
            Text(text = "4. ${stringResource(R.string.control_return)}", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(8.dp))
            Text(text = "5-minute alternatives: Drink water • 20 push-ups • Read 2 pages • Deep breathing (4-4-4) • Walk 100 steps", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(12.dp))
            var trigger by remember { mutableStateOf("") }
            var what by remember { mutableStateOf("") }
            var alternative by remember { mutableStateOf("") }
            OutlinedTextField(value = trigger, onValueChange = { trigger = it }, label = { Text("Trigger (e.g. boredom, stress)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = what, onValueChange = { what = it }, label = { Text("What distracted you?") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = alternative, onValueChange = { alternative = it }, label = { Text("Alternative used") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    if (what.isNotBlank()) {
                        viewModel.addDistraction(trigger, what, reasonsText, alternative)
                        what = ""; trigger = ""; alternative = ""
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Add to Distraction Diary") }
            Spacer(Modifier.height(8.dp))
            if (distractions.isEmpty()) {
                Text(text = "No diary entries yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                distractions.take(10).forEach { entry ->
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(text = "${entry.date} • ${entry.trigger.ifBlank { "General" }}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = entry.whatDistracted, style = MaterialTheme.typography.bodyMedium)
                            if (entry.alternativeUsed.isNotBlank()) Text(text = "Alternative: ${entry.alternativeUsed}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }

        item {
            SectionTitle(stringResource(R.string.motivation_title))
            Spacer(Modifier.height(8.dp))
            Text(text = Quotes.dailyQuote(viewModel.today, language == "hi"), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(8.dp))
            Quotes.all.take(4).forEach { q ->
                Text(text = "• ${if (language == "hi") q.hi else q.en}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(12.dp))
            Text(text = "Personal Goals", style = MaterialTheme.typography.titleSmall)
            goals.forEach { goal ->
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = goal.completed, onCheckedChange = { viewModel.updateGoal(goal.copy(completed = it)) })
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = goal.title, style = MaterialTheme.typography.bodyMedium)
                            Text(text = goal.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { viewModel.deleteGoal(goal.id) }) { Icon(Icons.Default.Delete, contentDescription = "Delete") }
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = goalTitle, onValueChange = { goalTitle = it }, label = { Text("New goal") }, modifier = Modifier.weight(1f))
                Button(onClick = { if (goalTitle.isNotBlank()) { viewModel.addGoal(goalTitle, "general"); goalTitle = "" } }) { Text("Add") }
            }
            Spacer(Modifier.height(12.dp))
            Text(text = "Future Vision Board", style = MaterialTheme.typography.titleSmall)
            vision.forEach { item ->
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "• ${item.text}", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                    IconButton(onClick = { viewModel.deleteVision(item.id) }) { Icon(Icons.Default.Delete, contentDescription = "Delete") }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = visionText, onValueChange = { visionText = it }, label = { Text("Vision (e.g. Clear Railway ALP)") }, modifier = Modifier.weight(1f))
                Button(onClick = { if (visionText.isNotBlank()) { viewModel.addVision(visionText); visionText = "" } }) { Text("Add") }
            }
        }

        item {
            SectionTitle(stringResource(R.string.report_title))
            Spacer(Modifier.height(8.dp))
            val s = dayStats
            if (s == null) {
                Text(text = "Loading report...", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                Text(text = "Date: ${s.date}", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Total study time: ${s.studyMinutes} min", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Total mobile usage: ${`in`.focuslife.app.data.UsageHelper.formatDuration(totalScreenMs)}", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Focus sessions completed: ${s.focusSessions} (${s.focusMinutes} min)", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Running: ${if (s.runningMinutes > 0) "${s.runningMinutes} min, ${s.distanceMeters} m" else "Missed — try tomorrow"}", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Habits completed: ${s.habitsCompleted}/${s.habitsTotal}", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Goals achieved today: ${s.tasksCompleted}/${s.tasksTotal} tasks", style = MaterialTheme.typography.bodyMedium)
                val improvement = when {
                    s.habitsCompleted < 5 -> "Improve: Complete more daily habits."
                    s.focusMinutes < 50 -> "Improve: Add one more focus session."
                    s.runningMinutes == 0 -> "Improve: Running was missed. Even 10 min counts."
                    else -> "Great day! Keep the streak going."
                }
                Text(text = "Areas requiring improvement: $improvement", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
            }
            Spacer(Modifier.height(12.dp))
            Text(text = "Weekly Performance", style = MaterialTheme.typography.titleSmall)
            weekStats.forEach { day ->
                Text(
                    text = "${day.date}: Study ${day.studyMinutes}m • Focus ${day.focusMinutes}m • Habits ${day.habitsCompleted}/${day.habitsTotal} • Run ${day.runningMinutes}m",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun PermissionRow(name: String, granted: Boolean, onFix: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = if (granted) "✓" else "✗",
                style = MaterialTheme.typography.titleLarge,
                color = if (granted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
            )
            Text(
                text = name,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium
            )
            OutlinedButton(onClick = onFix) {
                Text(if (granted) "Settings" else "Grant")
            }
        }
    }
}
