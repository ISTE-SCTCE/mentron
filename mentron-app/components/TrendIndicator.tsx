'use client';

import { memo } from 'react';

interface TrendIndicatorProps {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
}

// Static lookups instead of function calls
const COLORS = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-text-secondary',
} as const;

const ICONS = {
    up: '↑',
    down: '↓',
    neutral: '→',
} as const;

export const TrendIndicator = memo(function TrendIndicator({ percentage, direction }: TrendIndicatorProps) {
    return (
        <span className={`text-sm font-semibold ${COLORS[direction]}`}>
            {ICONS[direction]} {percentage}%
        </span>
    );
});

