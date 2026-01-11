'use client';

import { memo } from 'react';
import { TrendIndicator } from './TrendIndicator';
import { MiniBarChart } from './MiniBarChart';

interface StatCardProps {
    title: string;
    value: number | string;
    trend?: { percentage: number; direction: 'up' | 'down' | 'neutral' };
    subtitle?: string;
    chartData?: number[];
    color?: 'blue' | 'purple' | 'pink' | 'cyan';
    icon?: React.ReactNode;
}

// Static constants moved outside component
const BG_COLORS = {
    blue: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
    purple: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
    pink: 'bg-gradient-to-br from-pink-500/10 to-pink-600/5',
    cyan: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5',
} as const;

export const StatCard = memo(function StatCard({
    title,
    value,
    trend,
    subtitle,
    chartData,
    color = 'blue',
    icon
}: StatCardProps) {
    const hasChartData = chartData && chartData.length > 0;

    return (
        <div className={`glass-card ${BG_COLORS[color]} hover:scale-[1.02] transition-transform active:scale-[0.98] touch-manipulation`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {icon && <div className="text-text-secondary flex-shrink-0">{icon}</div>}
                        <p className="text-text-secondary text-xs sm:text-sm font-medium truncate">{title}</p>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums">{value}</span>
                        {trend && <TrendIndicator {...trend} />}
                    </div>
                    {subtitle && (
                        <p className="text-text-secondary text-xs mt-1 truncate">{subtitle}</p>
                    )}
                </div>
            </div>

            {hasChartData && (
                <div className="mt-3">
                    <MiniBarChart data={chartData} color={color} />
                </div>
            )}
        </div>
    );
});

