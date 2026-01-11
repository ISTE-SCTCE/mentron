'use client';

import { memo, useMemo } from 'react';

interface MiniBarChartProps {
    data: number[];
    color?: 'blue' | 'purple' | 'pink' | 'cyan';
}

// Static constants moved outside component to prevent recreation
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const COLOR_CLASSES = {
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
    cyan: 'bg-cyan-400',
} as const;

export const MiniBarChart = memo(function MiniBarChart({ data, color = 'blue' }: MiniBarChartProps) {
    // Memoize calculations to prevent recalculation on every render
    const { max, heights } = useMemo(() => {
        const maxVal = Math.max(...data, 1);
        return {
            max: maxVal,
            heights: data.map(val => (val / maxVal) * 100)
        };
    }, [data]);

    const colorClass = COLOR_CLASSES[color];

    return (
        <div className="flex items-end gap-1 h-16 mt-4">
            {heights.map((height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className={`w-full rounded-t ${colorClass} opacity-70 hover:opacity-100 transition-all`}
                        style={{ height: `${height}%`, minHeight: '2px' }}
                        title={`${DAYS[index]}: ${data[index]}`}
                    />
                </div>
            ))}
        </div>
    );
});

