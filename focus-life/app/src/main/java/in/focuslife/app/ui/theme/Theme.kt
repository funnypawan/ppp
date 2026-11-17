package `in`.focuslife.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val NavyBackground = Color(0xFF0B1226)
private val NavySurface = Color(0xFF141E3A)
private val NavySurfaceVariant = Color(0xFF1E2A4A)
private val Teal = Color(0xFF2DD4BF)
private val Gold = Color(0xFFFBBF24)
private val Rose = Color(0xFFFB7185)

private val DarkScheme = darkColorScheme(
    primary = Teal,
    secondary = Gold,
    tertiary = Rose,
    background = NavyBackground,
    surface = NavySurface,
    surfaceVariant = NavySurfaceVariant,
    onPrimary = Color(0xFF0B1226),
    onBackground = Color(0xFFF1F5F9),
    onSurface = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF94A3B8)
)

@Composable
fun FocusLifeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkScheme,
        content = content
    )
}
