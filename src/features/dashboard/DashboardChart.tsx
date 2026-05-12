import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardChartPoint = {
  day: string;
  habitsCompleted: number;
  focusMinutes: number;
  tasksCompleted: number;
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
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="habitsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
            dy={8}
          />
          <YAxis hide />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Area
            type="monotone"
            dataKey="focusMinutes"
            name="Focus minutes"
            stroke="#3b82f6"
            fill="url(#focusGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="habitsCompleted"
            name="Habits completed"
            stroke="#10b981"
            fill="url(#habitsGradient)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Bar
            dataKey="tasksCompleted"
            name="Tasks completed"
            fill="#f59e0b"
            radius={[6, 6, 2, 2]}
            barSize={10}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
