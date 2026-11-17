package `in`.focuslife.app.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import `in`.focuslife.app.R
import `in`.focuslife.app.data.UsageHelper
import `in`.focuslife.app.service.FocusTimerService
import `in`.focuslife.app.ui.components.SectionTitle
import `in`.focuslife.app.ui.components.StatCard
import `in`.focuslife.app.ui.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusScreen(viewModel: AppViewModel) {
    val context = LocalContext.current
    var task by remember { mutableStateOf("") }
    var customMinutes by remember { mutableStateOf("25") }
    var selectedPreset by remember { mutableIntStateOf(25) }
    var mode by remember { mutableStateOf("deep_focus") }
    val activeMode by viewModel.activeMode.collectAsState()
    val blockedApps by viewModel.blockedApps.collectAsState()
    val usage by viewModel.usage.collectAsState()
    val totalScreenMs by viewModel.totalScreenMs.collectAsState()
    val dailyLimit by viewModel.dailyScreenLimit.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()
    val focusTaskSaved by viewModel.focusTask.collectAsState()

    LaunchedEffect(focusTaskSaved) {
        if (task.isBlank() && focusTaskSaved.isNotBlank()) task = focusTaskSaved
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = stringResource(R.string.focus_title), style = MaterialTheme.typography.headlineSmall)
        }

        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = task,
                        onValueChange = { task = it },
                        label = { Text(stringResource(R.string.focus_current_task)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(25, 50).forEach { mins ->
                            FilterChip(
                                selected = selectedPreset == mins,
                                onClick = { selectedPreset = mins; customMinutes = mins.toString() },
                                label = { Text("$mins min") }
                            )
                        }
                        OutlinedTextField(
                            value = customMinutes,
                            onValueChange = { customMinutes = it.filter(Char::isDigit).take(3) },
                            label = { Text("Custom (min)") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("deep_focus", "study", "running", "sleep").forEach { m ->
                            FilterChip(
                                selected = mode == m,
                                onClick = { mode = m },
                                label = { Text(m.replace("_", " ").replaceFirstChar { it.uppercase() }) }
                            )
                        }
                    }
                    Button(
                        onClick = {
                            val mins = customMinutes.toIntOrNull()?.coerceIn(1, 180) ?: 25
                            viewModel.setFocusTask(task)
                            viewModel.setActiveMode(mode)
                            val intent = Intent(context, FocusTimerService::class.java).apply {
                                action = FocusTimerService.ACTION_START
                                putExtra(FocusTimerService.EXTRA_MINUTES, mins)
                                putExtra(FocusTimerService.EXTRA_TASK, task)
                                putExtra(FocusTimerService.EXTRA_MODE, mode)
                            }
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                context.startForegroundService(intent)
                            } else {
                                context.startService(intent)
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(stringResource(R.string.focus_start))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { context.startService(Intent(context, FocusTimerService::class.java).apply { action = FocusTimerService.ACTION_PAUSE }) },
                            modifier = Modifier.weight(1f)
                        ) { Text(stringResource(R.string.focus_pause)) }
                        OutlinedButton(
                            onClick = { context.startService(Intent(context, FocusTimerService::class.java).apply { action = FocusTimerService.ACTION_RESUME }) },
                            modifier = Modifier.weight(1f)
                        ) { Text(stringResource(R.string.focus_resume)) }
                        OutlinedButton(
                            onClick = {
                                context.startService(Intent(context, FocusTimerService::class.java).apply { action = FocusTimerService.ACTION_STOP })
                                viewModel.setActiveMode("none")
                            },
                            modifier = Modifier.weight(1f)
                        ) { Text(stringResource(R.string.focus_stop)) }
                    }
                    if (activeMode != "none") {
                        Text(text = "Active mode: $activeMode", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        item {
            SectionTitle("App Blocker — Select Distracting Apps")
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Select apps to warn during Focus modes. Uses Accessibility only for the warning screen. You can disable it anytime in Settings.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(8.dp))
            val knownApps = listOf(
                "com.google.android.youtube" to "YouTube",
                "com.instagram.android" to "Instagram",
                "com.facebook.katana" to "Facebook",
                "com.dts.freefireth" to "Free Fire",
                "com.tencent.ig" to "PUBG Mobile",
                "com.whatsapp" to "WhatsApp",
                "com.twitter.android" to "X (Twitter)",
                "com.snapchat.android" to "Snapchat"
            )
            knownApps.forEach { (pkg, name) ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = name, modifier = Modifier.weight(1f))
                    Switch(
                        checked = pkg in blockedApps,
                        onCheckedChange = { checked ->
                            val updated = if (checked) blockedApps + pkg else blockedApps - pkg
                            viewModel.setBlockedApps(updated)
                        }
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
                    },
                    modifier = Modifier.weight(1f)
                ) { Text("Accessibility Settings") }
                OutlinedButton(
                    onClick = {
                        context.startActivity(UsageHelper.usageAccessIntent(context))
                    },
                    modifier = Modifier.weight(1f)
                ) { Text("Usage Access") }
            }
        }

        item {
            SectionTitle("Mobile Usage Analyzer")
            Spacer(Modifier.height(8.dp))
            if (!UsageHelper.hasUsageAccess(context)) {
                Text(
                    text = stringResource(R.string.perm_usage_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                Button(onClick = { context.startActivity(UsageHelper.usageAccessIntent(context)) }) {
                    Text("Grant Usage Access")
                }
            } else {
                StatCard(
                    title = "Total Screen Time Today",
                    value = UsageHelper.formatDuration(totalScreenMs),
                    subtitle = "Daily limit: ${dailyLimit} min",
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Text(text = "Daily limit (minutes): $dailyLimit", style = MaterialTheme.typography.bodySmall)
                Slider(
                    value = dailyLimit.toFloat(),
                    onValueChange = { viewModel.setDailyScreenLimit(it.toInt()) },
                    valueRange = 30f..600f,
                    steps = 0
                )
                Spacer(Modifier.height(8.dp))
                if (usage.isEmpty()) {
                    Text(text = "No usage data yet. Use your phone and return.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    usage.take(10).forEach { app ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = app.appName, style = MaterialTheme.typography.bodyMedium)
                                Text(text = app.packageName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = UsageHelper.formatDuration(app.foregroundMs), style = MaterialTheme.typography.bodyMedium)
                                Text(text = "${app.launchCount} opens", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                UsageHelper.suggestions(totalScreenMs, dailyLimit).forEach { s ->
                    Text(text = "• $s", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        item {
            SectionTitle("Focus Session History")
            Spacer(Modifier.height(8.dp))
            if (focusSessions.isEmpty()) {
                Text(text = "No focus sessions yet today.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                focusSessions.forEach { session ->
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(modifier = Modifier.padding(12.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = session.taskTitle.ifBlank { "Focus session" }, style = MaterialTheme.typography.bodyMedium)
                                Text(text = "${session.actualMinutes} min • ${session.mode}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(text = if (session.completed) "✓" else "—", style = MaterialTheme.typography.titleLarge)
                        }
                    }
                }
            }
        }
    }
}
