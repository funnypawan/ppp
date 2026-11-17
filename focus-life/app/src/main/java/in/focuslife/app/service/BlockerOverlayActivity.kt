package `in`.focuslife.app.service

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import `in`.focuslife.app.R
import `in`.focuslife.app.data.PreferencesManager
import `in`.focuslife.app.ui.theme.FocusLifeTheme
import kotlinx.coroutines.launch

class BlockerOverlayActivity : ComponentActivity() {
    companion object {
        const val EXTRA_PACKAGE = "package"
        const val EXTRA_MODE = "mode"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pkg = intent.getStringExtra(EXTRA_PACKAGE) ?: ""
        val mode = intent.getStringExtra(EXTRA_MODE) ?: ""
        setContent {
            FocusLifeTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    var showUnlock by remember { mutableStateOf(false) }
                    var reason by remember { mutableStateOf("") }
                    val scope = rememberCoroutineScope()
                    val prefs = remember { PreferencesManager(this@BlockerOverlayActivity) }
                    var personalReasons by remember { mutableStateOf("") }
                    LaunchedEffect(Unit) {
                        prefs.personalReasons.collect { personalReasons = it }
                    }

                    Column(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = stringResource(R.string.blocker_warning_title),
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = stringResource(R.string.blocker_warning_desc),
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        if (personalReasons.isNotBlank()) {
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = "\"$personalReasons\"",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "App: $pkg • Mode: $mode",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(24.dp))
                        Button(onClick = { finish() }, modifier = Modifier.fillMaxWidth()) {
                            Text(stringResource(R.string.go_back))
                        }
                        Spacer(Modifier.height(12.dp))
                        OutlinedButton(onClick = { showUnlock = true }, modifier = Modifier.fillMaxWidth()) {
                            Text(stringResource(R.string.emergency_unlock))
                        }
                        if (showUnlock) {
                            Spacer(Modifier.height(16.dp))
                            OutlinedTextField(
                                value = reason,
                                onValueChange = { reason = it },
                                label = { Text("Why do you need to unlock?") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(Modifier.height(8.dp))
                            Button(
                                onClick = {
                                    scope.launch {
                                        prefs.incrementEmergencyUnlock()
                                        finish()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Confirm Emergency Unlock")
                            }
                        }
                    }
                }
            }
        }
    }
}
