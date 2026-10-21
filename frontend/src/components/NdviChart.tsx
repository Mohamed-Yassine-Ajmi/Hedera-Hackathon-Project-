import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { NdviPoint } from '../types';

interface Props {
  data: NdviPoint[];
  height?: number;
}

export default function NdviChart({ data, height = 260 }: Props) {
  return (
    <div className="glass-card p-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-400" />
        NDVI Time Series
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(d: string) => d.slice(5)}
            stroke="#334155"
          />
          <YAxis
            domain={[0.3, 0.8]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="#334155"
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0',
              fontSize: 12,
            }}
            formatter={(v: number) => [v.toFixed(3), 'NDVI']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#ndviGrad)"
            dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#34d399' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
