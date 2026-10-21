package com.focuslock.app.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.focuslock.app.R
import com.focuslock.app.data.AppLimitEntity
import com.focuslock.app.databinding.BottomSheetEditLimitBinding
import com.focuslock.app.domain.BlockEngine
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.TimeUtils
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.chip.Chip
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Edit-limit sheet for ONE app.
 *
 * Rules implemented here (see requirements §3):
 *  - Shows current limit and today's usage before anything changes.
 *  - Quick presets (5m…2h) plus a custom hours/minutes picker.
 *  - Live preview of the remaining time after saving, computed against
 *    usage that has *already* been consumed — editing a limit never resets
 *    usage (e.g. used 25m, limit 30m -> 60m leaves 35m).
 *  - A new limit below current usage warns that the app will be blocked
 *    immediately (and it will be: the next protection tick sees
 *    usage >= limit).
 *  - Optional explicit "reset today's counted usage" (a baseline offset —
 *    Android's own usage history is never altered).
 *  - Per-app exemption for essential apps, and confirmed limit removal.
 */
class EditLimitBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetEditLimitBinding? = null
    private val binding get() = _binding!!

    private var packageNameArg: String = ""
    private var appLabel: String = ""
    private var existingLimit: AppLimitEntity? = null
    /** Effective usage today (system usage minus any reset offset). */
    private var usageTodayMillis: Long = 0L
    /** Raw system usage today (needed to apply a new reset offset). */
    private var systemUsageTodayMillis: Long = 0L

    private var customChipId: Int = View.NO_ID
    private var updatingPickers: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        packageNameArg = requireArguments().getString(ARG_PACKAGE).orEmpty()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetEditLimitBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        buildPresetChips()

        binding.hoursPicker.minValue = 0
        binding.hoursPicker.maxValue = 12
        binding.minutesPicker.minValue = 0
        binding.minutesPicker.maxValue = 59

        val pickerListener = { _: android.widget.NumberPicker, _: Int, _: Int ->
            if (!updatingPickers) {
                // Manual time entry means "Custom".
                if (customChipId != View.NO_ID) {
                    binding.presetChipGroup.check(customChipId)
                }
                updatePreview()
            }
        }
        binding.hoursPicker.setOnValueChangedListener(pickerListener)
        binding.minutesPicker.setOnValueChangedListener(pickerListener)

        binding.presetChipGroup.setOnCheckedStateChangeListener { group, checkedIds ->
            val chipId = checkedIds.firstOrNull() ?: return@setOnCheckedStateChangeListener
            val chip = group.findViewById<Chip>(chipId)
            val preset = chip?.tag as? Int
            if (preset != null) setPickers(preset)
            updatePreview()
        }

        binding.exemptCheckBox.setOnCheckedChangeListener { _, _ -> updatePreview() }
        binding.resetUsageCheckBox.setOnCheckedChangeListener { _, _ -> updatePreview() }

        binding.cancelButton.setOnClickListener { dismiss() }
        binding.saveButton.setOnClickListener { save() }
        binding.removeLimitButton.setOnClickListener { confirmRemoveLimit() }

        loadData()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    private fun buildPresetChips() {
        val group = binding.presetChipGroup
        for (preset in PRESETS) {
            val chip = Chip(requireContext()).apply {
                id = View.generateViewId()
                text = TimeUtils.formatMinutes(preset)
                tag = preset
                isCheckable = true
                isClickable = true
            }
            group.addView(chip)
        }
        val customChip = Chip(requireContext()).apply {
            id = View.generateViewId()
            text = getString(R.string.custom_duration)
            tag = null
            isCheckable = true
            isClickable = true
        }
        customChipId = customChip.id
        group.addView(customChip)
    }

    private fun loadData() {
        lifecycleScope.launch {
            val app = requireContext().focusLockApp
            appLabel = app.appsRepository.appLabel(packageNameArg)
            existingLimit = app.database.appLimitDao().getForPackage(packageNameArg)
            systemUsageTodayMillis = withContext(Dispatchers.IO) {
                app.usageTracker.usageForPackageToday(packageNameArg)
            }
            usageTodayMillis = app.appsRepository.effectiveUsageToday(packageNameArg)

            val b = _binding ?: return@launch
            b.sheetAppIcon.setImageDrawable(app.appsRepository.appIcon(packageNameArg))
            b.sheetAppName.text = appLabel

            val currentLimitText = existingLimit?.let {
                TimeUtils.formatMinutes(it.dailyLimitMinutes)
            } ?: getString(R.string.no_limit_set)
            b.sheetCurrentInfo.text =
                getString(R.string.current_limit) + ": " + currentLimitText +
                    "   ·   " + getString(R.string.used_today) + ": " +
                    TimeUtils.formatDuration(usageTodayMillis)

            // Initial selection: existing limit, otherwise a sensible 30m default.
            val initial = existingLimit?.dailyLimitMinutes ?: DEFAULT_MINUTES
            setPickers(initial)
            checkChipFor(initial)

            b.exemptCheckBox.isChecked = existingLimit?.exempt == true
            b.resetUsageContainer.visibility =
                if (systemUsageTodayMillis > 0L) View.VISIBLE else View.GONE
            b.removeLimitButton.visibility =
                if (existingLimit != null) View.VISIBLE else View.GONE

            updatePreview()
        }
    }

    private fun checkChipFor(totalMinutes: Int) {
        val group = binding.presetChipGroup
        for (i in 0 until group.childCount) {
            val chip = group.getChildAt(i) as? Chip ?: continue
            if ((chip.tag as? Int) == totalMinutes) {
                group.check(chip.id)
                return
            }
        }
        if (customChipId != View.NO_ID) group.check(customChipId)
    }

    private fun setPickers(totalMinutes: Int) {
        updatingPickers = true
        binding.hoursPicker.value = (totalMinutes / 60).coerceIn(0, 12)
        binding.minutesPicker.value = (totalMinutes % 60).coerceIn(0, 59)
        updatingPickers = false
    }

    private fun selectedMinutes(): Int =
        binding.hoursPicker.value * 60 + binding.minutesPicker.value

    private fun updatePreview() {
        val b = _binding ?: return
        val exempt = b.exemptCheckBox.isChecked
        val minutes = selectedMinutes()
        // If the user also asked to reset today's counter, the preview must
        // be computed against 0 usage.
        val effectiveUsage =
            if (b.resetUsageCheckBox.isChecked) 0L else usageTodayMillis

        if (exempt) {
            b.sheetPreviewText.text = getString(R.string.exempt_hint)
            b.sheetBlockNote.visibility = View.GONE
            return
        }

        val remaining = BlockEngine.remainingMillis(effectiveUsage, minutes)
        b.sheetPreviewText.text =
            getString(R.string.new_limit) + ": " + TimeUtils.formatMinutes(minutes) +
                "\n" + getString(
                    R.string.remaining_after_save,
                    TimeUtils.formatDuration(remaining)
                )
        b.sheetBlockNote.visibility =
            if (minutes > 0 && effectiveUsage >= minutes * 60_000L) View.VISIBLE
            else View.GONE
    }

    private fun save() {
        val exempt = binding.exemptCheckBox.isChecked
        val minutes = selectedMinutes()
        if (!exempt && minutes <= 0) {
            Toast.makeText(
                requireContext(), R.string.error_limit_zero, Toast.LENGTH_SHORT
            ).show()
            return
        }
        val resetUsage = binding.resetUsageCheckBox.isChecked

        lifecycleScope.launch {
            val app = requireContext().focusLockApp
            val now = System.currentTimeMillis()
            app.database.appLimitDao().upsert(
                AppLimitEntity(
                    packageName = packageNameArg,
                    dailyLimitMinutes = minutes,
                    enabled = true,
                    exempt = exempt,
                    updatedAtMillis = now
                )
            )
            if (resetUsage) {
                // Baseline offset: from now on, effective usage =
                // system usage − usage-at-this-moment.
                app.database.dailyUsageDao().setUsageOffset(
                    pkg = packageNameArg,
                    date = TimeUtils.dateKey(now),
                    offsetMillis = systemUsageTodayMillis
                )
            }
            Toast.makeText(
                requireContext(), R.string.limit_saved, Toast.LENGTH_SHORT
            ).show()
            dismiss()
        }
    }

    private fun confirmRemoveLimit() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.no_limit_option)
            .setMessage(getString(R.string.confirm_remove_limit_msg, appLabel))
            .setPositiveButton(R.string.turn_off) { _, _ ->
                lifecycleScope.launch {
                    requireContext().focusLockApp.database.appLimitDao()
                        .deleteForPackage(packageNameArg)
                    dismiss()
                }
            }
            .setNegativeButton(R.string.keep_limit, null)
            .show()
    }

    companion object {
        private const val ARG_PACKAGE = "arg_package"
        private const val DEFAULT_MINUTES = 30
        private val PRESETS = listOf(5, 10, 15, 30, 45, 60, 120)

        fun newInstance(packageName: String): EditLimitBottomSheet {
            return EditLimitBottomSheet().apply {
                arguments = Bundle().apply { putString(ARG_PACKAGE, packageName) }
            }
        }
    }
}
