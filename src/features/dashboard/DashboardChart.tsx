import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardChartPoint = {
  day: string;
  habitsCompleted: number;
  focusMinutes: number;
  projectProgress: number;
};

const tooltipStyle = {
  backgroundColor: '#080b13',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  color: '#fff',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
};

export function DashboardChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }}
            dy={12}
          />
          <YAxis yAxisId="count" hide />
          <YAxis yAxisId="progress" orientation="right" hide domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.035)' }} />
          <Bar
            yAxisId="count"
            dataKey="habitsCompleted"
            name="Habits completed"
            fill="#10b981"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            yAxisId="count"
            dataKey="focusMinutes"
            name="Focus minutes"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            yAxisId="progress"
            type="monotone"
            dataKey="projectProgress"
            name="Project progress"
            stroke="var(--color-accent)"
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--color-accent)' }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
