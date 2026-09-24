import { formatSigned, formatYield } from '../../lib/format.js'

/**
 * SHAP waterfall for a single prediction, drawn as plain SVG so it matches the
 * thesis figure: feature names down the left, contributions pushing the value
 * from the base expectation across to the final prediction.
 */

const LAYOUT = {
  width: 780,
  labelWidth: 196,
  rightPad: 74,
  headerHeight: 58,
  rowHeight: 26,
  barHeight: 14,
  axisHeight: 26,
  titleHeight: 24,
}

const NICE_STEPS = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000]

function buildScale(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)

  let lo = Math.floor((min - range * 0.9) / 100) * 100
  let hi = Math.ceil((max + range * 0.2) / 100) * 100
  if (hi <= lo) hi = lo + 100

  const step =
    NICE_STEPS.find((candidate) => (hi - lo) / candidate <= 7) ?? NICE_STEPS[NICE_STEPS.length - 1]

  const ticks = []
  for (let tick = lo; tick <= hi + 0.001; tick += step) {
    ticks.push(Number(tick.toFixed(4)))
  }

  return { lo, hi, ticks }
}

/** Positive bars darken towards the top, as in the reference figure. */
function positiveFill(rank, total) {
  const t = total <= 1 ? 0 : rank / (total - 1)
  const from = [31, 93, 51]
  const to = [124, 196, 137]
  const channel = (i) => Math.round(from[i] + (to[i] - from[i]) * t)
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}

export default function ShapWaterfall({ baseValue, prediction, shapValues }) {
  const { width, labelWidth, rightPad, headerHeight, rowHeight, barHeight, axisHeight, titleHeight } =
    LAYOUT

  // Positive contributions first (largest down to smallest), then negatives.
  const positives = shapValues.filter((item) => item.value >= 0).sort((a, b) => b.value - a.value)
  const negatives = shapValues.filter((item) => item.value < 0).sort((a, b) => a.value - b.value)
  const ordered = [...positives, ...negatives]

  let running = baseValue
  const rows = ordered.map((item) => {
    const start = running
    const end = start + item.value
    running = end
    return {
      ...item,
      start,
      end,
      fill: item.value >= 0 ? positiveFill(positives.indexOf(item), positives.length) : '#C7352F',
    }
  })

  const finalValue = prediction ?? running
  const plotWidth = width - labelWidth - rightPad
  const plotHeight = rows.length * rowHeight
  const height = headerHeight + plotHeight + axisHeight + titleHeight

  const { lo, hi, ticks } = buildScale([
    baseValue,
    finalValue,
    ...rows.flatMap((row) => [row.start, row.end]),
  ])

  const x = (value) => labelWidth + ((value - lo) / (hi - lo)) * plotWidth
  const axisY = headerHeight + plotHeight

  // Keep the two header labels readable when base value and prediction are close.
  const baseX = x(baseValue)
  const finalX = Math.min(x(finalValue), width - rightPad + 40)
  const labelsClash = Math.abs(finalX - baseX) < 90
  const baseLabel = labelsClash
    ? { x: baseX + (baseX <= finalX ? -4 : 4), anchor: baseX <= finalX ? 'end' : 'start' }
    : { x: baseX, anchor: 'middle' }
  const finalLabel = labelsClash
    ? { x: finalX + (baseX <= finalX ? 4 : -4), anchor: baseX <= finalX ? 'start' : 'end' }
    : { x: finalX, anchor: 'middle' }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="SHAP waterfall chart of feature contributions"
    >
      {/* Base value / final prediction annotations */}
      <g>
        <text
          x={baseLabel.x}
          y={16}
          textAnchor={baseLabel.anchor}
          className="fill-muted"
          style={{ fontSize: 10 }}
        >
          Base value
        </text>
        <text
          x={baseLabel.x}
          y={31}
          textAnchor={baseLabel.anchor}
          className="fill-ink"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          {formatYield(baseValue)}
        </text>
        <line
          x1={x(baseValue)}
          y1={38}
          x2={x(baseValue)}
          y2={axisY}
          stroke="#B8C4BB"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        <text
          x={finalLabel.x}
          y={16}
          textAnchor={finalLabel.anchor}
          className="fill-muted"
          style={{ fontSize: 10 }}
        >
          Final prediction
        </text>
        <text
          x={finalLabel.x}
          y={31}
          textAnchor={finalLabel.anchor}
          className="fill-ink"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          {formatYield(finalValue)}
        </text>
        <line
          x1={x(finalValue)}
          y1={38}
          x2={x(finalValue)}
          y2={axisY}
          stroke="#8FA795"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </g>

      {/* Vertical grid */}
      {ticks.map((tick) => (
        <line
          key={tick}
          x1={x(tick)}
          y1={headerHeight}
          x2={x(tick)}
          y2={axisY}
          stroke="#EDF1EE"
          strokeWidth="1"
        />
      ))}

      {/* Contribution bars */}
      {rows.map((row, index) => {
        const y = headerHeight + index * rowHeight + (rowHeight - barHeight) / 2
        const left = x(Math.min(row.start, row.end))
        const barWidth = Math.max(Math.abs(x(row.end) - x(row.start)), 2)
        const isPositive = row.value >= 0

        return (
          <g key={row.feature}>
            <text
              x={labelWidth - 12}
              y={y + barHeight / 2 + 3.5}
              textAnchor="end"
              className="fill-muted"
              style={{ fontSize: 10 }}
            >
              {row.feature}
            </text>
            <rect x={left} y={y} width={barWidth} height={barHeight} rx="2" fill={row.fill} />
            <text
              x={isPositive ? left + barWidth + 6 : left - 6}
              y={y + barHeight / 2 + 3.5}
              textAnchor={isPositive ? 'start' : 'end'}
              fill={isPositive ? '#2F6B3E' : '#C7352F'}
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {formatSigned(row.value)}
            </text>
          </g>
        )
      })}

      {/* X axis */}
      <line x1={labelWidth} y1={axisY} x2={labelWidth + plotWidth} y2={axisY} stroke="#D7DFD9" />
      {ticks.map((tick) => (
        <g key={`tick-${tick}`}>
          <line x1={x(tick)} y1={axisY} x2={x(tick)} y2={axisY + 4} stroke="#D7DFD9" />
          <text
            x={x(tick)}
            y={axisY + 16}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 10 }}
          >
            {tick.toLocaleString('en-US')}
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
        Made Tea Yield (kg/ha)
      </text>
    </svg>
  )
}
