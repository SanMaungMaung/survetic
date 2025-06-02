import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartProps {
  data: Array<{ label: string; value: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function PieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const dataWithPercentage = data.map((item) => ({
    ...item,
    name: item.label,
    percentage: Math.round((item.value / total) * 100),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value} (${Math.round((value / total) * 100)}%)`, 
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload?.percentage}%)
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
