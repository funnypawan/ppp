# Ronny Personal Assistant keeps every framework component it declares in the
# manifest, so only the obvious noise is stripped.
-keepattributes *Annotation*
-keepclassmembers class * extends android.app.Activity { public void *(android.view.View); }
-keepclassmembers class * extends android.app.Service { *; }
-keepclassmembers class * extends android.content.BroadcastReceiver { *; }
-keepclassmembers class **.R$* { public static <fields>; }
