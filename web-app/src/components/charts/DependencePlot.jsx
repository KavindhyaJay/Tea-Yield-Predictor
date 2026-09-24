import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { shapColor } from '../../lib/format.js'

/** Feature value against its SHAP value for one feature. */
export default function DependencePlot({ feature, unit, points }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 32, left: 8 }}>
        <CartesianGrid stroke="#EDF1EE" />
        <XAxis
          type="number"
          dataKey="x"
          domain={['auto', 'auto']}
          tickLine={false}
          axisLine={{ stroke: '#D7DFD9' }}
          tick={{ fontSize: 10 }}
          label={{
            value: unit ? `${feature} (${unit})` : feature,
            position: 'insideBottom',
            offset: -18,
            style: { fontSize: 11, fill: '#66756B' },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          tickLine={false}
          axisLine={{ stroke: '#D7DFD9' }}
          tick={{ fontSize: 10 }}
          label={{
            value: 'SHAP value',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 11, fill: '#66756B' },
          }}
        />
        <ReferenceLine y={0} stroke="#B8C4BB" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ border: '1px solid #E1E7E2', borderRadius: 6, fontSize: 12 }}
          formatter={(value, name) => [
            Number(value).toFixed(2),
            name === 'x' ? feature : 'SHAP value',
          ]}
        />
        <Scatter data={points}>
          {points.map((point, index) => (
            <Cell key={index} fill={shapColor(point.normalized)} fillOpacity={0.8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
