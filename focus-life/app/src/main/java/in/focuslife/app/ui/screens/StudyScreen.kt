package `in`.focuslife.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import `in`.focuslife.app.R
import `in`.focuslife.app.data.DefaultData
import `in`.focuslife.app.ui.components.SectionTitle
import `in`.focuslife.app.ui.viewmodel.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyScreen(viewModel: AppViewModel) {
    var title by remember { mutableStateOf("") }
    var subject by remember { mutableStateOf(DefaultData.subjects.first()) }
    var chapter by remember { mutableStateOf("") }
    var targetMinutes by remember { mutableStateOf("60") }
    var exam by remember { mutableStateOf(DefaultData.exams.first()) }
    var subjectExpanded by remember { mutableStateOf(false) }
    var examExpanded by remember { mutableStateOf(false) }

    val tasks by viewModel.studyTasks.collectAsState()
    val weekStats by viewModel.weekStats.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = stringResource(R.string.study_title), style = MaterialTheme.typography.headlineSmall)
            Text(
                text = "Exams: Railway ALP • Railway Group D • SSC CGL • SSC GD",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Study target (e.g. Trigonometry practice)") }, modifier = Modifier.fillMaxWidth())
                    ExposedDropdownMenuBox(expanded = subjectExpanded, onExpandedChange = { subjectExpanded = !subjectExpanded }) {
                        OutlinedTextField(value = subject, onValueChange = {}, readOnly = true, label = { Text("Subject") }, modifier = Modifier.fillMaxWidth().menuAnchor())
                        ExposedDropdownMenu(expanded = subjectExpanded, onDismissRequest = { subjectExpanded = false }) {
                            DefaultData.subjects.forEach { s ->
                                DropdownMenuItem(text = { Text(s) }, onClick = { subject = s; subjectExpanded = false })
                            }
                        }
                    }
                    OutlinedTextField(value = chapter, onValueChange = { chapter = it }, label = { Text("Chapter / Topic") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = targetMinutes, onValueChange = { targetMinutes = it.filter(Char::isDigit).take(3) }, label = { Text("Target minutes") }, modifier = Modifier.fillMaxWidth())
                    ExposedDropdownMenuBox(expanded = examExpanded, onExpandedChange = { examExpanded = !examExpanded }) {
                        OutlinedTextField(value = exam, onValueChange = {}, readOnly = true, label = { Text("Exam") }, modifier = Modifier.fillMaxWidth().menuAnchor())
                        ExposedDropdownMenu(expanded = examExpanded, onDismissRequest = { examExpanded = false }) {
                            DefaultData.exams.forEach { e ->
                                DropdownMenuItem(text = { Text(e) }, onClick = { exam = e; examExpanded = false })
                            }
                        }
                    }
                    Button(
                        onClick = {
                            if (title.isNotBlank()) {
                                viewModel.addStudyTask(title, subject, chapter, targetMinutes.toIntOrNull() ?: 60, exam)
                                title = ""; chapter = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Add Daily Target") }
                }
            }
        }

        item {
            SectionTitle("Today's Targets (${tasks.count { it.completed }}/${tasks.size})")
            Spacer(Modifier.height(8.dp))
            if (tasks.isEmpty()) {
                Text(text = "No targets yet. Add one above.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                tasks.forEach { task ->
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = task.completed, onCheckedChange = { viewModel.toggleStudyTask(task) })
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = if (task.completed) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${task.subject} • ${task.chapter.ifBlank { "General" }} • ${task.targetMinutes} min • ${task.exam}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            IconButton(onClick = { viewModel.deleteStudyTask(task.id) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete")
                            }
                        }
                    }
                }
            }
        }

        item {
            SectionTitle("Weekly Study Statistics")
            Spacer(Modifier.height(8.dp))
            if (weekStats.isEmpty()) {
                Text(text = "No data yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                weekStats.forEach { day ->
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Text(text = day.date, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        Text(text = "${day.studyMinutes} min study • ${day.focusMinutes} min focus", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Tip: Use Focus timer (25/50 min) for each target. Revision reminders are sent at 11:00 and 19:00 when tasks are pending.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
