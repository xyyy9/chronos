'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ChartPoint = {
  logicalDate: string;
  mood: number;
  sleepQuality: number;
};

type ClientChartProps = {
  data: ChartPoint[];
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function ClientChart({ data }: ClientChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-black/10 text-sm text-black/50">
        No entries yet. Your chart will appear here once you log data.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#e5e5e5" />
          <XAxis
            dataKey="logicalDate"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 12 }}
            stroke="#a3a3a3"
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#a3a3a3"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(value) => `Date: ${formatDateLabel(value as string)}`}
            formatter={(value, name) => [`${value}`, name === 'mood' ? 'Mood' : 'Sleep Quality']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Mood"
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sleepQuality"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Sleep Quality"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
