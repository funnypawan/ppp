# FocusLock ProGuard rules
# Keep Room entities / generated code and Kotlin metadata intact.
-keep class com.focuslock.app.data.** { *; }
-dontwarn androidx.room.**
-keepattributes *Annotation*, InnerClasses, EnclosingMethod
