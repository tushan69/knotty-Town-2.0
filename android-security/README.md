# Android Container & Hybrid Security Hardening Templates

This directory contains robust security templates for when you wrap or compile this React application into a hybrid Android container (using **Capacitor**, **Cordova**, or a custom native **WebView**).

These files implement the requested security measures:
1. **Network Security Config** (`network_security_config.xml`): Restricts all HTTP communication, enforcing HTTPS/TLS-only traffic.
2. **ProGuard Rules** (`proguard-rules.pro`): Sets up minification and scrambles compiled signatures to prevent extraction of application logic.
3. **Encrypted Shared Preferences** (`EncryptedSharedPrefsTemplate.kt`): Implements AES-256 encrypted native key-value storage backed by the hardware Android Keystore.

---

### How to use:

#### 1. Enable HTTPS-Only inside your Android app:
- Copy the [network_security_config.xml](network_security_config.xml) file into your Android project at:
  `android/app/src/main/res/xml/network_security_config.xml`
- Update your `AndroidManifest.xml` under the `<application>` tag to reference this configuration:
  ```xml
  <application
      android:networkSecurityConfig="@xml/network_security_config"
      ... >
  ```

#### 2. Enable ProGuard Obfuscation:
- Open your app's build gradle file (`android/app/build.gradle`) and make sure minification is enabled in your release config:
  ```groovy
  buildTypes {
      release {
          minifyEnabled true
          shrinkResources true
          proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
      }
  }
  ```
- Copy the rules from [proguard-rules.pro](proguard-rules.pro) and append them to your project's local `proguard-rules.pro` inside `android/app/`.

#### 3. Secure Session Tokens using EncryptedSharedPreferences:
- Add the Google Crypto library to your app dependencies (`android/app/build.gradle`):
  ```groovy
  dependencies {
      implementation "androidx.security:security-crypto:1.1.0-alpha06"
  }
  ```
- Review [EncryptedSharedPrefsTemplate.kt](EncryptedSharedPrefsTemplate.kt) for a reference Kotlin module to store JWT tokens, user settings, or authentication logs securely.
