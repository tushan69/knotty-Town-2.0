# ==============================================================================
# KNOTTY TOWN - Release ProGuard / R8 Obfuscation & Shrinking Rules
# ==============================================================================

# Obfuscate all local Kotlin/Java code classes to prevent reverse-engineering
-repackageclasses 'com.knottytown.secure'
-allowaccessmodification

# Safe-keep Capacitor and Cordova frameworks (relies heavily on Java Reflection)
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }

# Keep web view integrations safe
-keep class android.webkit.** { *; }

# Support generic signing credentials & cryptographic functions
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers and source files for clean, obfuscated crash diagnostics
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod

# Strip debug log files out of compilation for release environment
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
