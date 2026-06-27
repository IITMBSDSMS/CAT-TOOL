'use client';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface GaugeChartProps {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  factors?: Record<string, number>;
}

export default function GaugeChart({ score, label, color, bgColor, factors }: GaugeChartProps) {
  const data = [{ name: 'Score', value: score, fill: color }];

  return (
    <div className="gauge-container">
      <div style={{ position: 'relative', width: 200, height: 120 }}>
        <ResponsiveContainer width="100%" height={120}>
          <RadialBarChart
            cx="50%" cy="100%"
            innerRadius="60%" outerRadius="100%"
            barSize={16}
            data={data}
            startAngle={180} endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: '#F1F5F9' }} dataKey="value" angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div className="gauge-score">{score}</div>
        </div>
      </div>
      <div className="gauge-label" style={{ background: bgColor, color }}>{label}</div>
      {factors && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {Object.entries(factors).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 90, textTransform: 'capitalize', flexShrink: 0 }}>{key}</div>
              <div style={{ flex: 1, height: 5, background: 'var(--grey-100)', borderRadius: 99 }}>
                <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color, width: 30, textAlign: 'right' }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
