package com.focuslock.app.ui

import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.focuslock.app.R
import com.focuslock.app.data.AppIconCache
import com.focuslock.app.data.AppUiModel
import com.focuslock.app.databinding.FragmentAppsBinding
import com.focuslock.app.databinding.ItemAppBinding
import com.focuslock.app.focusLockApp
import com.focuslock.app.util.TimeUtils
import com.google.android.material.color.MaterialColors
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

/**
 * All Apps: every launchable installed app with today's usage, its daily
 * limit, remaining time, a progress bar, an enable/disable switch and an
 * Edit button. Supports search, sorting (usage / A–Z) and filtering
 * (all / with limits / without limits / exempt).
 */
class AppsFragment : Fragment() {

    private var _binding: FragmentAppsBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: AppsAdapter

    private var allApps: List<AppUiModel> = emptyList()
    private var query: String = ""
    private var sortMode: SortMode = SortMode.USAGE
    private var filterMode: FilterMode = FilterMode.ALL

    enum class SortMode { USAGE, NAME }
    enum class FilterMode { ALL, WITH_LIMITS, WITHOUT_LIMITS, EXEMPT }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAppsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = AppsAdapter(
            onEdit = ::onEditClicked,
            onSwitch = ::onSwitchToggled
        )
        binding.appsRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.appsRecyclerView.adapter = adapter

        binding.searchEditText.doAfterTextChanged {
            query = it?.toString()?.trim().orEmpty()
            applyFilters()
        }

        binding.sortChipGroup.setOnCheckedStateChangeListener { _, checkedIds ->
            sortMode =
                if (checkedIds.contains(R.id.chipSortName)) SortMode.NAME else SortMode.USAGE
            applyFilters()
        }

        binding.filterChipGroup.setOnCheckedStateChangeListener { _, checkedIds ->
            filterMode = when {
                checkedIds.contains(R.id.chipFilterWithLimits) -> FilterMode.WITH_LIMITS
                checkedIds.contains(R.id.chipFilterWithoutLimits) -> FilterMode.WITHOUT_LIMITS
                checkedIds.contains(R.id.chipFilterExempt) -> FilterMode.EXEMPT
                else -> FilterMode.ALL
            }
            applyFilters()
        }

        // Reload whenever limits change (edit sheet, switch, import, …).
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                requireContext().focusLockApp.database.appLimitDao().observeAll()
                    .collect { loadApps() }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Usage figures change while the user is elsewhere; refresh them.
        if (_binding != null) loadApps()
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }

    private fun loadApps() {
        _binding?.appsProgress?.visibility = View.VISIBLE
        viewLifecycleOwner.lifecycleScope.launch {
            val apps = requireContext().focusLockApp.appsRepository.loadApps()
            allApps = apps
            _binding?.appsProgress?.visibility = View.GONE
            applyFilters()
        }
    }

    private fun applyFilters() {
        var list = allApps
        if (query.isNotEmpty()) {
            list = list.filter { it.label.contains(query, ignoreCase = true) }
        }
        list = when (filterMode) {
            FilterMode.ALL -> list
            FilterMode.WITH_LIMITS -> list.filter { it.hasLimit && !it.isExempt }
            FilterMode.WITHOUT_LIMITS -> list.filter { !it.hasLimit }
            FilterMode.EXEMPT -> list.filter { it.isExempt }
        }
        list = when (sortMode) {
            SortMode.USAGE -> list.sortedByDescending { it.usageTodayMillis }
            SortMode.NAME -> list.sortedBy { it.label.lowercase() }
        }
        adapter.submitList(list)
        _binding?.appsEmptyText?.visibility =
            if (list.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun onEditClicked(model: AppUiModel) {
        // In Strict Mode this first demands PIN (+ cooldown if configured).
        StrictGate.requestAccess(this) {
            EditLimitBottomSheet.newInstance(model.packageName)
                .show(childFragmentManager, TAG_EDIT_LIMIT)
        }
    }

    private fun onSwitchToggled(model: AppUiModel, checked: Boolean) {
        val app = requireContext().focusLockApp
        val limit = model.limit
        when {
            checked && limit == null -> {
                // No limit yet: the switch acts as "create one".
                onEditClicked(model)
            }
            checked && limit != null && !limit.enabled -> {
                // Re-enabling protection is always allowed immediately.
                viewLifecycleOwner.lifecycleScope.launch {
                    app.database.appLimitDao().upsert(
                        limit.copy(
                            enabled = true,
                            updatedAtMillis = System.currentTimeMillis()
                        )
                    )
                }
            }
            !checked && limit != null && limit.enabled -> {
                // Disabling protection requires confirmation (and the
                // Strict Mode gate when enabled).
                StrictGate.requestAccess(this) {
                    MaterialAlertDialogBuilder(requireContext())
                        .setTitle(R.string.confirm_disable_title)
                        .setMessage(getString(R.string.confirm_disable_msg, model.label))
                        .setPositiveButton(R.string.turn_off) { _, _ ->
                            viewLifecycleOwner.lifecycleScope.launch {
                                app.database.appLimitDao().upsert(
                                    limit.copy(
                                        enabled = false,
                                        updatedAtMillis = System.currentTimeMillis()
                                    )
                                )
                            }
                        }
                        .setNegativeButton(R.string.keep_limit, null)
                        .show()
                }
            }
        }
    }

    companion object {
        private const val TAG_EDIT_LIMIT = "edit_limit"
    }
}

/** RecyclerView adapter for the installed-apps list. */
class AppsAdapter(
    private val onEdit: (AppUiModel) -> Unit,
    private val onSwitch: (AppUiModel, Boolean) -> Unit
) : ListAdapter<AppUiModel, AppsAdapter.ViewHolder>(DIFF) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemAppBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemAppBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(model: AppUiModel) {
            val context = binding.root.context

            binding.appIcon.setImageDrawable(
                AppIconCache.get(context, model.packageName)
            )
            binding.appName.text = model.label

            // Usage + limit summary line
            val usedText = context.getString(
                R.string.used_today_label,
                TimeUtils.formatDuration(model.usageTodayMillis)
            )
            binding.appUsage.text = if (model.limit != null) {
                usedText + "  ·  " + context.getString(
                    R.string.limit_label,
                    TimeUtils.formatMinutes(model.limit.dailyLimitMinutes)
                )
            } else {
                usedText + "  ·  " + context.getString(R.string.no_limit_set)
            }

            // Status chip
            val (statusTextRes, bgAttr, fgAttr) = when {
                model.isExempt -> Triple(
                    R.string.status_exempt,
                    R.attr.colorTertiaryContainer, R.attr.colorOnTertiaryContainer
                )
                model.limit == null -> Triple(
                    R.string.status_no_limit,
                    R.attr.colorSurfaceVariant, R.attr.colorOnSurfaceVariant
                )
                !model.limit.enabled -> Triple(
                    R.string.status_disabled,
                    R.attr.colorSurfaceVariant, R.attr.colorOnSurfaceVariant
                )
                model.isOverLimit -> Triple(
                    R.string.status_over_limit,
                    R.attr.colorErrorContainer, R.attr.colorOnErrorContainer
                )
                else -> Triple(
                    R.string.status_protected,
                    R.attr.colorPrimaryContainer, R.attr.colorOnPrimaryContainer
                )
            }
            binding.statusChip.text = context.getString(statusTextRes)
            binding.statusChip.chipBackgroundColor = ColorStateList.valueOf(
                MaterialColors.getColor(binding.root, bgAttr)
            )
            binding.statusChip.setTextColor(
                MaterialColors.getColor(binding.root, fgAttr)
            )

            // Progress + remaining time
            if (model.limitActive) {
                binding.usageProgress.visibility = View.VISIBLE
                binding.usageProgress.setProgressCompat(
                    (model.progress * 100).toInt(), false
                )
                binding.appRemaining.visibility = View.VISIBLE
                binding.appRemaining.text = context.getString(
                    R.string.remaining_label,
                    TimeUtils.formatDuration(model.remainingMillis)
                )
            } else {
                binding.usageProgress.visibility = View.GONE
                binding.appRemaining.visibility = View.GONE
            }

            // Enable/disable switch. A click listener is used (instead of a
            // checked-change listener) so the switch can snap back to the
            // persisted state while the fragment decides whether the change
            // is allowed (confirmation dialog / Strict Mode).
            val switchState = model.limit?.enabled == true && !model.isExempt
            binding.limitSwitch.setOnClickListener(null)
            binding.limitSwitch.isChecked = switchState
            binding.limitSwitch.isEnabled = !model.isExempt
            binding.limitSwitch.setOnClickListener {
                val desired = binding.limitSwitch.isChecked
                binding.limitSwitch.isChecked = switchState // snap back for now
                onSwitch(model, desired)
            }

            binding.editButton.setOnClickListener { onEdit(model) }
            binding.root.setOnClickListener { onEdit(model) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<AppUiModel>() {
            override fun areItemsTheSame(oldItem: AppUiModel, newItem: AppUiModel): Boolean =
                oldItem.packageName == newItem.packageName

            override fun areContentsTheSame(oldItem: AppUiModel, newItem: AppUiModel): Boolean =
                oldItem == newItem
        }
    }
}
