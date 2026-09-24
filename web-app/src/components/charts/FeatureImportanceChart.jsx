import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/** Mean absolute SHAP value per feature — global importance across the dataset. */
export default function FeatureImportanceChart({ data }) {
  const rows = [...data].sort((a, b) => b.value - a.value)

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 26 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 24, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#EDF1EE" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={{ stroke: '#D7DFD9' }}
          tick={{ fontSize: 10 }}
          label={{
            value: 'Mean |SHAP value|',
            position: 'insideBottom',
            offset: -12,
            style: { fontSize: 11, fill: '#66756B' },
          }}
        />
        <YAxis
          type="category"
          dataKey="feature"
          width={186}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          cursor={{ fill: '#F4F8F5' }}
          contentStyle={{
            border: '1px solid #E1E7E2',
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(value) => [value.toFixed(2), 'Mean |SHAP|']}
        />
        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={12}>
          {rows.map((row, index) => (
            <Cell key={row.feature} fill={index < 3 ? '#2F6B3E' : '#5FA86D'} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value) => value.toFixed(1)}
            style={{ fontSize: 10, fill: '#66756B' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
