package com.focuslock.app.data

import android.content.Context
import android.util.Base64
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

private val Context.pinDataStore: DataStore<Preferences> by preferencesDataStore(name = "pin_store")

/**
 * Strict Mode PIN storage.
 *
 * The PIN itself is never stored. We keep a random 16-byte salt and a
 * PBKDF2-HMAC-SHA256 hash (120k iterations) in the app's private storage,
 * and verify with a constant-time comparison.
 */
class PinManager(private val context: Context) {

    private object Keys {
        val SALT = stringPreferencesKey("pin_salt_b64")
        val HASH = stringPreferencesKey("pin_hash_b64")
    }

    suspend fun isPinSet(): Boolean =
        context.pinDataStore.data.first()[Keys.HASH] != null

    suspend fun setPin(pin: String) {
        val salt = ByteArray(SALT_BYTES).also { SecureRandom().nextBytes(it) }
        val hash = hashPin(pin, salt)
        context.pinDataStore.edit {
            it[Keys.SALT] = Base64.encodeToString(salt, Base64.NO_WRAP)
            it[Keys.HASH] = Base64.encodeToString(hash, Base64.NO_WRAP)
        }
    }

    suspend fun verify(pin: String): Boolean {
        val prefs = context.pinDataStore.data.first()
        val saltB64 = prefs[Keys.SALT] ?: return false
        val hashB64 = prefs[Keys.HASH] ?: return false
        val salt = runCatching { Base64.decode(saltB64, Base64.NO_WRAP) }.getOrNull() ?: return false
        val expected = runCatching { Base64.decode(hashB64, Base64.NO_WRAP) }.getOrNull() ?: return false
        val actual = hashPin(pin, salt)
        return MessageDigest.isEqual(expected, actual)
    }

    suspend fun clear() {
        context.pinDataStore.edit {
            it.remove(Keys.SALT)
            it.remove(Keys.HASH)
        }
    }

    private suspend fun hashPin(pin: String, salt: ByteArray): ByteArray =
        withContext(Dispatchers.Default) {
            val spec = PBEKeySpec(pin.toCharArray(), salt, ITERATIONS, KEY_BITS)
            try {
                SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).encoded
            } finally {
                spec.clearPassword()
            }
        }

    companion object {
        private const val SALT_BYTES = 16
        private const val ITERATIONS = 120_000
        private const val KEY_BITS = 256
        const val MIN_LENGTH = 4
        const val MAX_LENGTH = 6

        fun isValidFormat(pin: String): Boolean =
            pin.length in MIN_LENGTH..MAX_LENGTH && pin.all { it.isDigit() }
    }
}
