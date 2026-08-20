import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export const RECIPE_CHART_COLORS = ['#4A90E2', '#7FDB6A', '#FF9F5A', '#E74C3C', '#9B59B6']

export type RecipeDonutItem = {
  name: string
  value: number
  color: string
  label: string
}

export function RecipeDonutChart({ data }: { data: RecipeDonutItem[] }) {
  const chartData = data
    .filter(item => item.value > 0)
    .map((item, index) => ({
      ...item,
      color: item.color || RECIPE_CHART_COLORS[index % RECIPE_CHART_COLORS.length],
    }))

  if (chartData.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={entry => entry.label}
        >
          {chartData.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
