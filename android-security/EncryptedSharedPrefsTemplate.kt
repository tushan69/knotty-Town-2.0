package com.knottytown.secure

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * KNOTTY TOWN - Hardware-Backed Secure Storage Module (Android Keystore)
 * 
 * Provides transparent, AES-256 encrypted native key-value storage.
 * Ideal for storing high-sensitivity data (JWT Auth Tokens, Checkout state).
 */
object SecureStorage {

    private const val PREFS_FILE_NAME = "knotty_secure_preferences"

    /**
     * Initializes and returns an instance of EncryptedSharedPreferences
     */
    fun getSecurePrefs(context: Context): SharedPreferences {
        // Step 1: Create or fetch the Master Key from the Android Keystore system
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

        // Step 2: Initialize EncryptedSharedPreferences with key-value and content encryption schemes
        return EncryptedSharedPreferences.create(
            PREFS_FILE_NAME,
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,      // AES-256-SIV for keys
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM      // AES-256-GCM for values
        )
    }

    /**
     * Save a string securely (e.g. JWT Token)
     */
    fun saveSecureString(context: Context, key: String, value: String) {
        val prefs = getSecurePrefs(context)
        prefs.edit().putString(key, value).apply()
    }

    /**
     * Read a string securely
     */
    fun getSecureString(context: Context, key: String, defaultValue: String? = null): String? {
        val prefs = getSecurePrefs(context)
        return prefs.getString(key, defaultValue)
    }

    /**
     * Clear all keys (useful during logout actions)
     */
    fun clearAll(context: Context) {
        val prefs = getSecurePrefs(context)
        prefs.edit().clear().apply()
    }
}
