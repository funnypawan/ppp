package `in`.focuslife.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import `in`.focuslife.app.ui.screens.FocusScreen
import `in`.focuslife.app.ui.screens.HabitsScreen
import `in`.focuslife.app.ui.screens.HomeScreen
import `in`.focuslife.app.ui.screens.ProfileScreen
import `in`.focuslife.app.ui.screens.StudyScreen
import `in`.focuslife.app.ui.theme.FocusLifeTheme
import `in`.focuslife.app.ui.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {
    private val requestNotifPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        setContent {
            FocusLifeTheme {
                val viewModel: AppViewModel = viewModel()
                var selectedTab by remember { mutableIntStateOf(0) }
                val tabs = listOf(
                    Triple(Icons.Default.Home, stringResource(R.string.nav_home)) { HomeScreen(viewModel, onOpenFocus = { selectedTab = 1 }, onOpenStudy = { selectedTab = 2 }) },
                    Triple(Icons.Default.Timer, stringResource(R.string.nav_focus)) { FocusScreen(viewModel) },
                    Triple(Icons.Default.Book, stringResource(R.string.nav_study)) { StudyScreen(viewModel) },
                    Triple(Icons.Default.CheckCircle, stringResource(R.string.nav_habits)) { HabitsScreen(viewModel) },
                    Triple(Icons.Default.Person, stringResource(R.string.nav_profile)) { ProfileScreen(viewModel) }
                )

                LaunchedEffect(Unit) {
                    viewModel.refreshAll()
                    viewModel.refreshUsage()
                }

                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            tabs.forEachIndexed { index, (icon, label, _) ->
                                NavigationBarItem(
                                    selected = selectedTab == index,
                                    onClick = { selectedTab = index },
                                    icon = { Icon(icon, contentDescription = label) },
                                    label = { Text(label) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        tabs[selectedTab].third()
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Refresh usage when returning from permission settings
        // ViewModel refresh is triggered via LaunchedEffect; also safe to re-query here
    }
}
