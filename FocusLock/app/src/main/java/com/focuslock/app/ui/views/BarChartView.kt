package com.focuslock.app.ui.views

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.focuslock.app.R
import com.google.android.material.R as MaterialR
import com.focuslock.app.util.TimeUtils
import com.google.android.material.color.MaterialColors
import kotlin.math.ceil
import kotlin.math.min

/**
 * Minimal daily-totals bar chart drawn on a Canvas.
 *
 * Implemented as a custom view (instead of pulling in a charting library)
 * so the project stays dependency-light and builds everywhere, including
 * AndroidIDE. Shows value labels for small data sets and automatically
 * thins out x-axis labels for 30-day ranges.
 */
class BarChartView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    data class Bar(val valueMillis: Long, val label: String)

    var bars: List<Bar> = emptyList()
        set(value) {
            field = value
            invalidate()
        }

    private val density: Float = resources.displayMetrics.density

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.chart_bar)
    }
    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.chart_bar_track)
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = MaterialColors.getColor(this@BarChartView, MaterialR.attr.colorOnSurfaceVariant)
        textAlign = Paint.Align.CENTER
        textSize = 10f * density
    }
    private val valuePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = MaterialColors.getColor(this@BarChartView, MaterialR.attr.colorOnSurface)
        textAlign = Paint.Align.CENTER
        textSize = 9f * density
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (bars.isEmpty() || width == 0 || height == 0) return

        val labelAreaHeight = 20f * density
        val showValues = bars.size <= 7
        val valueAreaHeight = if (showValues) 16f * density else 6f * density
        val chartTop = valueAreaHeight
        val chartBottom = height - labelAreaHeight
        val chartHeight = (chartBottom - chartTop).coerceAtLeast(0f)

        val maxValue = bars.maxOf { it.valueMillis }.coerceAtLeast(1L)
        val slotWidth = width.toFloat() / bars.size
        val barWidth = min(slotWidth * 0.6f, 28f * density)
        val corner = 4f * density
        val labelStep = ceil(bars.size / 8.0).toInt().coerceAtLeast(1)

        bars.forEachIndexed { index, bar ->
            val centerX = slotWidth * index + slotWidth / 2f
            val left = centerX - barWidth / 2f
            val right = centerX + barWidth / 2f

            // Track (full height, subtle).
            canvas.drawRoundRect(left, chartTop, right, chartBottom, corner, corner, trackPaint)

            if (bar.valueMillis > 0L) {
                val fraction = bar.valueMillis.toFloat() / maxValue.toFloat()
                val barHeight = maxOf(chartHeight * fraction, 3f * density)
                val top = chartBottom - barHeight
                canvas.drawRoundRect(left, top, right, chartBottom, corner, corner, barPaint)
                if (showValues) {
                    canvas.drawText(
                        TimeUtils.formatDuration(bar.valueMillis),
                        centerX,
                        top - 4f * density,
                        valuePaint
                    )
                }
            }

            if (index % labelStep == 0) {
                canvas.drawText(bar.label, centerX, height - 4f * density, labelPaint)
            }
        }
    }
}
