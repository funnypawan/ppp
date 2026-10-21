package com.focuslock.app.ui

import android.view.LayoutInflater
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity
import com.focuslock.app.R
import com.focuslock.app.data.PinManager
import com.focuslock.app.databinding.DialogPinBinding
import com.focuslock.app.databinding.DialogSetPinBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/** PIN entry / creation dialogs used by Strict Mode. */
object PinDialogs {

    /**
     * Asks for the current PIN. [onSuccess] runs only after a correct entry;
     * a wrong PIN keeps the dialog open with an error message.
     */
    fun showVerifyPin(
        activity: FragmentActivity,
        pinManager: PinManager,
        scope: CoroutineScope,
        onSuccess: () -> Unit,
        onCancel: (() -> Unit)? = null
    ) {
        val binding = DialogPinBinding.inflate(LayoutInflater.from(activity))
        val dialog = MaterialAlertDialogBuilder(activity)
            .setTitle(R.string.pin_enter_title)
            .setMessage(R.string.pin_enter_msg)
            .setView(binding.root)
            .setPositiveButton(R.string.unlock, null) // wired below (no auto-dismiss)
            .setNegativeButton(R.string.cancel) { _, _ -> onCancel?.invoke() }
            .create()

        dialog.setOnShowListener {
            binding.pinEditText.requestFocus()
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val pin = binding.pinEditText.text?.toString().orEmpty()
                scope.launch {
                    if (pinManager.verify(pin)) {
                        dialog.dismiss()
                        onSuccess()
                    } else {
                        binding.pinInputLayout.error =
                            activity.getString(R.string.pin_wrong)
                    }
                }
            }
        }
        dialog.show()
    }

    /** Creates a new PIN (entered twice). [onSaved] runs after it is stored. */
    fun showSetPin(
        activity: FragmentActivity,
        pinManager: PinManager,
        scope: CoroutineScope,
        onSaved: () -> Unit,
        onCancel: (() -> Unit)? = null
    ) {
        val binding = DialogSetPinBinding.inflate(LayoutInflater.from(activity))
        val dialog = MaterialAlertDialogBuilder(activity)
            .setTitle(R.string.pin_create_title)
            .setView(binding.root)
            .setPositiveButton(R.string.save, null)
            .setNegativeButton(R.string.cancel) { _, _ -> onCancel?.invoke() }
            .create()

        dialog.setOnShowListener {
            binding.newPinEditText.requestFocus()
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val pin = binding.newPinEditText.text?.toString().orEmpty()
                val confirm = binding.confirmPinEditText.text?.toString().orEmpty()
                when {
                    !PinManager.isValidFormat(pin) ->
                        binding.newPinInputLayout.error =
                            activity.getString(R.string.pin_too_short)
                    pin != confirm ->
                        binding.confirmPinInputLayout.error =
                            activity.getString(R.string.pin_mismatch)
                    else -> scope.launch {
                        pinManager.setPin(pin)
                        dialog.dismiss()
                        onSaved()
                    }
                }
            }
        }
        dialog.show()
    }
}
