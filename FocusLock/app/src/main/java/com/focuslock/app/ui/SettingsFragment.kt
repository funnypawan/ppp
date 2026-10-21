package com.focuslock.app.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.focuslock.app.FocusLockApp
import com.focuslock.app.R
import com.focuslock.app.data.SettingsState
import com.focuslock.app.databinding.FragmentSettingsBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.service.MonitorService
import com.focuslock.app.util.BackupManager
import com.focuslock.app.util.TimeUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Settings: protection master switch, protection schedule, break mode
 * (manual + scheduled), Strict Mode (PIN + editing cooldown), theme,
 * settings backup (export/import to a user-chosen file) and About.
 *
 * Switches use click listeners with a "snap back" pattern: the visible
 * state only changes after the value is actually saved (and, in Strict
 * Mode, after the PIN gate passes).
 */
class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private var currentSettings: SettingsState = SettingsState()
    private var isBindingTheme: Boolean = false

    private val exportLauncher =
        registerForActivityResult(
            ActivityResultContracts.CreateDocument("application/json")
        ) { uri -> if (uri != null) writeExport(uri) }

    private val importLauncher =
        registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) readImport(uri)
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupListeners()

        binding.aboutVersionText.text = getString(
            R.string.about_version, appVersionName()
        )

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                requireContext().focusLockApp.settingsStore.flow.collect { state ->
                    currentSettings = state
                    bindSettings(state)
                }
            }
        }

        // Break status is time-based; keep it fresh while visible.
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                while (true) {
                    updateBreakStatus()
                    delay(5_000L)
                }
            }
        }
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    // ---------------------------------------------------------- binding

    private fun bindSettings(state: SettingsState) {
        val b = _binding ?: return
        b.protectionSwitch.isChecked = state.protectionEnabled

        b.scheduleSwitch.isChecked = state.scheduleEnabled
        b.scheduleStartButton.text =
            TimeUtils.formatMinutesOfDay(state.scheduleStartMinutes)
        b.scheduleEndButton.text =
            TimeUtils.formatMinutesOfDay(state.scheduleEndMinutes)
        b.scheduleStartButton.isEnabled = state.scheduleEnabled
        b.scheduleEndButton.isEnabled = state.scheduleEnabled

        b.scheduledBreakSwitch.isChecked = state.scheduledBreakEnabled
        b.scheduledBreakStartButton.text =
            TimeUtils.formatMinutesOfDay(state.scheduledBreakStartMinutes)
        b.scheduledBreakDurationButton.text =
            getString(R.string.minutes_short, state.scheduledBreakDurationMinutes)
        b.scheduledBreakStartButton.isEnabled = state.scheduledBreakEnabled
        b.scheduledBreakDurationButton.isEnabled = state.scheduledBreakEnabled

        b.strictSwitch.isChecked = state.strictModeEnabled
        b.cooldownButton.text =
            if (state.editCooldownMinutes <= 0) getString(R.string.cooldown_none)
            else getString(R.string.minutes_short, state.editCooldownMinutes)

        isBindingTheme = true
        b.themeToggleGroup.check(
            when (state.themeMode) {
                SettingsState.THEME_LIGHT -> R.id.themeLightButton
                SettingsState.THEME_DARK -> R.id.themeDarkButton
                else -> R.id.themeSystemButton
            }
        )
        isBindingTheme = false

        bindPinStatus()
        updateBreakStatus()
    }

    private fun bindPinStatus() {
        viewLifecycleOwner.lifecycleScope.launch {
            val isSet = requireContext().focusLockApp.pinManager.isPinSet()
            val b = _binding ?: return@launch
            b.pinStatusText.text = getString(
                if (isSet) R.string.pin_is_set_note else R.string.pin_not_set_note
            )
            b.pinSetButton.text = getString(
                if (isSet) R.string.pin_change else R.string.pin_set
            )
            b.pinRemoveButton.isEnabled = isSet
        }
    }

    private fun updateBreakStatus() {
        val b = _binding ?: return
        val now = System.currentTimeMillis()
        val state = currentSettings
        if (state.isBreakActive(now)) {
            b.breakStatusText.visibility = View.VISIBLE
            b.breakStatusText.text = getString(
                R.string.break_active_until,
                TimeUtils.formatTimeOfDay(state.breakEndsAt(now))
            )
            // Only a manual break can be ended early from here.
            b.breakEndButton.visibility =
                if (now < state.breakUntilMillis) View.VISIBLE else View.GONE
        } else {
            b.breakStatusText.visibility = View.GONE
            b.breakEndButton.visibility = View.GONE
        }
    }

    // ---------------------------------------------------------- listeners

    private fun setupListeners() {
        val b = binding

        // --- Protection master switch
        b.protectionSwitch.setOnClickListener {
            val desired = b.protectionSwitch.isChecked
            b.protectionSwitch.isChecked = currentSettings.protectionEnabled
            if (desired) enableProtection() else confirmDisableProtection()
        }

        b.permissionsButton.setOnClickListener {
            startActivity(Intent(requireContext(), PermissionSetupActivity::class.java))
        }

        // --- Protection schedule
        b.scheduleSwitch.setOnClickListener {
            val desired = b.scheduleSwitch.isChecked
            b.scheduleSwitch.isChecked = currentSettings.scheduleEnabled
            StrictGate.requestPinOnly(this) {
                viewLifecycleOwner.lifecycleScope.launch {
                    requireContext().focusLockApp.settingsStore.setSchedule(
                        desired,
                        currentSettings.scheduleStartMinutes,
                        currentSettings.scheduleEndMinutes
                    )
                }
            }
        }
        b.scheduleStartButton.setOnClickListener {
            StrictGate.requestPinOnly(this) {
                showTimePicker(currentSettings.scheduleStartMinutes) { picked ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        requireContext().focusLockApp.settingsStore.setSchedule(
                            currentSettings.scheduleEnabled,
                            picked,
                            currentSettings.scheduleEndMinutes
                        )
                    }
                }
            }
        }
        b.scheduleEndButton.setOnClickListener {
            StrictGate.requestPinOnly(this) {
                showTimePicker(currentSettings.scheduleEndMinutes) { picked ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        requireContext().focusLockApp.settingsStore.setSchedule(
                            currentSettings.scheduleEnabled,
                            currentSettings.scheduleStartMinutes,
                            picked
                        )
                    }
                }
            }
        }

        // --- Break mode
        b.break15Button.setOnClickListener { startBreak(15) }
        b.break30Button.setOnClickListener { startBreak(30) }
        b.break60Button.setOnClickListener { startBreak(60) }
        b.breakEndButton.setOnClickListener {
            viewLifecycleOwner.lifecycleScope.launch {
                requireContext().focusLockApp.settingsStore.setBreakUntil(0L)
            }
        }
        b.scheduledBreakSwitch.setOnClickListener {
            val desired = b.scheduledBreakSwitch.isChecked
            b.scheduledBreakSwitch.isChecked = currentSettings.scheduledBreakEnabled
            StrictGate.requestPinOnly(this) {
                viewLifecycleOwner.lifecycleScope.launch {
                    requireContext().focusLockApp.settingsStore.setScheduledBreak(
                        desired,
                        currentSettings.scheduledBreakStartMinutes,
                        currentSettings.scheduledBreakDurationMinutes
                    )
                }
            }
        }
        b.scheduledBreakStartButton.setOnClickListener {
            StrictGate.requestPinOnly(this) {
                showTimePicker(currentSettings.scheduledBreakStartMinutes) { picked ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        requireContext().focusLockApp.settingsStore.setScheduledBreak(
                            currentSettings.scheduledBreakEnabled,
                            picked,
                            currentSettings.scheduledBreakDurationMinutes
                        )
                    }
                }
            }
        }
        b.scheduledBreakDurationButton.setOnClickListener {
            StrictGate.requestPinOnly(this) {
                val options = listOf(15, 30, 45, 60, 90, 120)
                showSingleChoice(
                    title = getString(R.string.break_scheduled_duration),
                    labels = options.map { getString(R.string.minutes_short, it) },
                    checkedIndex = options.indexOf(
                        currentSettings.scheduledBreakDurationMinutes
                    ).coerceAtLeast(0)
                ) { index ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        requireContext().focusLockApp.settingsStore.setScheduledBreak(
                            currentSettings.scheduledBreakEnabled,
                            currentSettings.scheduledBreakStartMinutes,
                            options[index]
                        )
                    }
                }
            }
        }

        // --- Strict Mode & PIN
        b.strictSwitch.setOnClickListener {
            val desired = b.strictSwitch.isChecked
            b.strictSwitch.isChecked = currentSettings.strictModeEnabled
            if (desired) enableStrictMode() else disableStrictMode()
        }
        b.pinSetButton.setOnClickListener { onSetOrChangePin() }
        b.pinRemoveButton.setOnClickListener { onRemovePin() }
        b.cooldownButton.setOnClickListener {
            StrictGate.requestPinOnly(this) {
                val options = listOf(0, 5, 15, 30)
                showSingleChoice(
                    title = getString(R.string.cooldown_label),
                    labels = options.map {
                        if (it == 0) getString(R.string.cooldown_none)
                        else getString(R.string.minutes_short, it)
                    },
                    checkedIndex = options.indexOf(
                        currentSettings.editCooldownMinutes
                    ).coerceAtLeast(0)
                ) { index ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        requireContext().focusLockApp.settingsStore
                            .setEditCooldownMinutes(options[index])
                    }
                }
            }
        }

        // --- Theme
        b.themeToggleGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked || isBindingTheme) return@addOnButtonCheckedListener
            val mode = when (checkedId) {
                R.id.themeLightButton -> SettingsState.THEME_LIGHT
                R.id.themeDarkButton -> SettingsState.THEME_DARK
                else -> SettingsState.THEME_SYSTEM
            }
            viewLifecycleOwner.lifecycleScope.launch {
                requireContext().focusLockApp.settingsStore.setThemeMode(mode)
            }
            FocusLockApp.applyThemeMode(mode)
        }

        // --- Backup
        b.exportButton.setOnClickListener {
            exportLauncher.launch("focuslock-settings.json")
        }
        b.importButton.setOnClickListener {
            importLauncher.launch(arrayOf("*/*"))
        }
    }

    // ---------------------------------------------------------- actions

    private fun enableProtection() {
        viewLifecycleOwner.lifecycleScope.launch {
            val app = requireContext().focusLockApp
            app.settingsStore.setProtectionEnabled(true)
            MonitorService.start(requireContext())
        }
    }

    private fun confirmDisableProtection() {
        // Strict gate first (PIN + cooldown), then an explicit confirmation.
        StrictGate.requestAccess(this) {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.confirm_disable_protection_title)
                .setMessage(R.string.confirm_disable_protection_msg)
                .setPositiveButton(R.string.turn_off) { _, _ ->
                    viewLifecycleOwner.lifecycleScope.launch {
                        val app = requireContext().focusLockApp
                        app.settingsStore.setProtectionEnabled(false)
                        MonitorService.stop(requireContext())
                    }
                }
                .setNegativeButton(R.string.keep_limit, null)
                .show()
        }
    }

    private fun startBreak(minutes: Int) {
        // A break pauses protection, so in Strict Mode it sits behind the
        // full gate as well. Breaks never reset usage or emergency counts.
        StrictGate.requestAccess(this) {
            viewLifecycleOwner.lifecycleScope.launch {
                val until = System.currentTimeMillis() + minutes * 60_000L
                requireContext().focusLockApp.settingsStore.setBreakUntil(until)
                Toast.makeText(
                    requireContext(),
                    getString(
                        R.string.break_active_until,
                        TimeUtils.formatTimeOfDay(until)
                    ),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun enableStrictMode() {
        viewLifecycleOwner.lifecycleScope.launch {
            val app = requireContext().focusLockApp
            if (app.pinManager.isPinSet()) {
                app.settingsStore.setStrictModeEnabled(true)
            } else if (isAdded) {
                // Strict Mode needs a PIN: create one first, then enable.
                PinDialogs.showSetPin(
                    activity = requireActivity(),
                    pinManager = app.pinManager,
                    scope = viewLifecycleOwner.lifecycleScope,
                    onSaved = {
                        viewLifecycleOwner.lifecycleScope.launch {
                            app.settingsStore.setStrictModeEnabled(true)
                            toast(R.string.pin_saved)
                        }
                    }
                )
            }
        }
    }

    private fun disableStrictMode() {
        val app = requireContext().focusLockApp
        viewLifecycleOwner.lifecycleScope.launch {
            if (!app.pinManager.isPinSet()) {
                app.settingsStore.setStrictModeEnabled(false)
                return@launch
            }
            if (!isAdded) return@launch
            PinDialogs.showVerifyPin(
                activity = requireActivity(),
                pinManager = app.pinManager,
                scope = viewLifecycleOwner.lifecycleScope,
                onSuccess = {
                    viewLifecycleOwner.lifecycleScope.launch {
                        app.settingsStore.setStrictModeEnabled(false)
                    }
                }
            )
        }
    }

    private fun onSetOrChangePin() {
        val app = requireContext().focusLockApp
        viewLifecycleOwner.lifecycleScope.launch {
            if (!isAdded) return@launch
            if (app.pinManager.isPinSet()) {
                // Changing the PIN requires knowing the current one.
                PinDialogs.showVerifyPin(
                    activity = requireActivity(),
                    pinManager = app.pinManager,
                    scope = viewLifecycleOwner.lifecycleScope,
                    onSuccess = { showSetPinDialog(app) }
                )
            } else {
                showSetPinDialog(app)
            }
        }
    }

    private fun showSetPinDialog(app: FocusLockApp) {
        if (!isAdded) return
        PinDialogs.showSetPin(
            activity = requireActivity(),
            pinManager = app.pinManager,
            scope = viewLifecycleOwner.lifecycleScope,
            onSaved = {
                toast(R.string.pin_saved)
                bindPinStatus()
            }
        )
    }

    private fun onRemovePin() {
        val app = requireContext().focusLockApp
        if (!isAdded) return
        PinDialogs.showVerifyPin(
            activity = requireActivity(),
            pinManager = app.pinManager,
            scope = viewLifecycleOwner.lifecycleScope,
            onSuccess = {
                viewLifecycleOwner.lifecycleScope.launch {
                    app.pinManager.clear()
                    // Strict Mode without a PIN cannot protect anything.
                    app.settingsStore.setStrictModeEnabled(false)
                    toast(R.string.pin_removed)
                    bindPinStatus()
                }
            }
        )
    }

    // ---------------------------------------------------------- backup

    private fun writeExport(uri: Uri) {
        viewLifecycleOwner.lifecycleScope.launch {
            val context = requireContext()
            val ok = withContext(Dispatchers.IO) {
                try {
                    val json = BackupManager.exportToJson(context)
                    context.contentResolver.openOutputStream(uri)?.use { out ->
                        out.write(json.toByteArray(Charsets.UTF_8))
                    } != null
                } catch (e: Exception) {
                    false
                }
            }
            toast(if (ok) R.string.backup_success else R.string.backup_failed)
        }
    }

    private fun readImport(uri: Uri) {
        viewLifecycleOwner.lifecycleScope.launch {
            val context = requireContext()
            val json = withContext(Dispatchers.IO) {
                try {
                    context.contentResolver.openInputStream(uri)?.use { input ->
                        input.readBytes().toString(Charsets.UTF_8)
                    }
                } catch (e: Exception) {
                    null
                }
            }
            if (json.isNullOrBlank()) {
                toast(R.string.import_failed)
                return@launch
            }
            if (!isAdded) return@launch
            // Importing changes limits, so it sits behind the Strict gate.
            StrictGate.requestPinOnly(this@SettingsFragment) {
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle(R.string.import_confirm_title)
                    .setMessage(R.string.import_confirm_msg)
                    .setPositiveButton(R.string.backup_import) { _, _ ->
                        viewLifecycleOwner.lifecycleScope.launch {
                            val app = requireContext().focusLockApp
                            val result = BackupManager.importFromJson(requireContext(), json)
                            if (result.isSuccess) {
                                val settings = app.settingsStore.current()
                                FocusLockApp.applyThemeMode(settings.themeMode)
                                MonitorService.startIfProtectionEnabled(requireContext())
                                toast(R.string.import_success)
                            } else {
                                toast(R.string.import_failed)
                            }
                        }
                    }
                    .setNegativeButton(R.string.cancel, null)
                    .show()
            }
        }
    }

    // ---------------------------------------------------------- helpers

    private fun showTimePicker(initialMinutesOfDay: Int, onPicked: (Int) -> Unit) {
        val picker = MaterialTimePicker.Builder()
            .setTimeFormat(TimeFormat.CLOCK_12H)
            .setHour((initialMinutesOfDay / 60) % 24)
            .setMinute(initialMinutesOfDay % 60)
            .build()
        picker.addOnPositiveButtonClickListener {
            onPicked(picker.hour * 60 + picker.minute)
        }
        picker.show(childFragmentManager, "time_picker")
    }

    private fun showSingleChoice(
        title: String,
        labels: List<String>,
        checkedIndex: Int,
        onSelected: (Int) -> Unit
    ) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(title)
            .setSingleChoiceItems(labels.toTypedArray(), checkedIndex) { dialog, which ->
                onSelected(which)
                dialog.dismiss()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun appVersionName(): String {
        return try {
            val context = requireContext()
            @Suppress("DEPRECATION")
            context.packageManager
                .getPackageInfo(context.packageName, 0).versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    private fun toast(messageRes: Int) {
        if (isAdded) {
            Toast.makeText(requireContext(), messageRes, Toast.LENGTH_SHORT).show()
        }
    }
}
