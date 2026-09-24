import { shapColor } from '../../lib/format.js'

/**
 * SHAP beeswarm ("Feature Impact") plot: one row per feature, each dot an
 * observation, positioned by its SHAP value and coloured by the feature value
 * from low (blue) to high (red).
 */

const LAYOUT = {
  width: 780,
  labelWidth: 196,
  rightPad: 40,
  rowHeight: 34,
  topPad: 10,
  axisHeight: 26,
  titleHeight: 24,
}

export default function ShapBeeswarm({ series }) {
  const { width, labelWidth, rightPad, rowHeight, topPad, axisHeight, titleHeight } = LAYOUT

  const plotWidth = width - labelWidth - rightPad
  const plotHeight = series.length * rowHeight
  const height = topPad + plotHeight + axisHeight + titleHeight

  const extent = Math.max(
    10,
    ...series.flatMap((row) => row.points.map((point) => Math.abs(point.shap)))
  )
  const bound = Math.ceil(extent / 50) * 50
  const step = bound / 2
  const ticks = []
  for (let tick = -bound; tick <= bound + 0.001; tick += step) {
    ticks.push(Number(tick.toFixed(2)))
  }

  const x = (value) => labelWidth + ((value + bound) / (2 * bound)) * plotWidth
  const axisY = topPad + plotHeight

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="SHAP feature impact beeswarm plot"
    >
      {/* Zero / reference line */}
      <line x1={x(0)} y1={topPad} x2={x(0)} y2={axisY} stroke="#B8C4BB" strokeWidth="1" />

      {series.map((row, rowIndex) => {
        const centerY = topPad + rowIndex * rowHeight + rowHeight / 2

        return (
          <g key={row.feature}>
            <text
              x={labelWidth - 12}
              y={centerY + 3.5}
              textAnchor="end"
              className="fill-muted"
              style={{ fontSize: 10 }}
            >
              {row.feature}
            </text>
            {row.points.map((point, pointIndex) => (
              <circle
                key={`${row.feature}-${pointIndex}`}
                cx={x(point.shap)}
                cy={centerY + point.jitter * (rowHeight - 14)}
                r="2.6"
                fill={shapColor(point.normalized)}
                fillOpacity="0.85"
              />
            ))}
          </g>
        )
      })}

      {/* X axis */}
      <line x1={labelWidth} y1={axisY} x2={labelWidth + plotWidth} y2={axisY} stroke="#D7DFD9" />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} y1={axisY} x2={x(tick)} y2={axisY + 4} stroke="#D7DFD9" />
          <text
            x={x(tick)}
            y={axisY + 16}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 10 }}
          >
            {tick}
          </text>
        </g>
      ))}

      <text
        x={labelWidth + plotWidth / 2}
        y={height - 6}
        textAnchor="middle"
        className="fill-muted"
        style={{ fontSize: 11 }}
      >
        SHAP value (impact on model output)
      </text>
    </svg>
  )
}

/** Blue-to-red legend shown above the beeswarm. */
export function ShapColorLegend() {
  return (
    <div className="mx-auto mb-3 flex max-w-md items-center gap-2">
      <span className="text-2xs text-muted">Low impact</span>
      <div
        className="h-3 flex-1 rounded-sm"
        style={{ background: 'linear-gradient(to right, #2166E0, #F2F2F2, #D62728)' }}
      />
      <span className="text-2xs text-muted">High impact</span>
    </div>
  )
}
