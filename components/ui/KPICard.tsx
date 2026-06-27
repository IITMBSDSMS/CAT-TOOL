import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  delay?: number;
}

export default function KPICard({ label, value, icon, iconBg, iconColor, trend, trendLabel, suffix, delay = 0 }: KPICardProps) {
  const trendDir = trend === undefined ? 'neutral' : trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  return (
    <div className="kpi-card animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-header">
        <div className="kpi-icon" style={{ background: iconBg || 'rgba(14,140,140,0.10)', color: iconColor || 'var(--teal)' }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {value}{suffix && <span style={{ fontSize: 20, fontWeight: 600 }}>{suffix}</span>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`kpi-trend ${trendDir}`}>
          {trendDir === 'up' && <TrendingUp size={13} />}
          {trendDir === 'down' && <TrendingDown size={13} />}
          {trendDir === 'neutral' && <Minus size={13} />}
          {Math.abs(trend)}% {trendLabel || 'vs last month'}
        </div>
      )}
    </div>
  );
}
