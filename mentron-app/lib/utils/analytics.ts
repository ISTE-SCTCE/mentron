/**
 * Analytics utility functions for the MENTRON dashboard
 * All mathematical operations include validation and error handling
 */

/**
 * Calculate counts for last 7 days from date-stamped data
 */
export function getLast7DaysCounts(data: { created_at: string }[]) {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    data.forEach(item => {
        if (!item.created_at) return; // Skip invalid entries

        try {
            const itemDate = new Date(item.created_at);
            if (isNaN(itemDate.getTime())) return; // Skip invalid dates

            const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
            const diffTime = today.getTime() - itemDay.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                counts[6 - diffDays]++;
            }
        } catch {
            // Skip items with invalid dates
        }
    });

    return counts;
}

/**
 * Calculate growth percentage between two periods
 * Returns formatted string with sign
 */
export function calculateGrowth(currentPeriod: number, previousPeriod: number): string {
    // Validate inputs
    if (typeof currentPeriod !== 'number' || typeof previousPeriod !== 'number') {
        return "0%";
    }

    if (previousPeriod === 0) {
        return currentPeriod > 0 ? "+100%" : "0%";
    }

    const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;

    // Cap extreme values for display
    const cappedGrowth = Math.max(-999, Math.min(999, growth));

    return `${cappedGrowth > 0 ? '+' : ''}${cappedGrowth.toFixed(1)}%`;
}

/**
 * Calculate percentage with validation and bounds
 */
export function calculatePercentage(part: number, total: number): number {
    if (typeof part !== 'number' || typeof total !== 'number') return 0;
    if (total === 0) return 0;

    const percentage = (part / total) * 100;
    return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Format large numbers for display (e.g., 1.2K, 3.5M)
 */
export function formatNumber(num: number): string {
    if (typeof num !== 'number' || isNaN(num)) return '0';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Get weekly view trend data aggregated by day
 */
export function getWeeklyViewTrend(materials: { view_count?: number; created_at: string }[]): number[] {
    const viewsByDay = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    materials.forEach(material => {
        if (!material.created_at) return;

        try {
            const itemDate = new Date(material.created_at);
            if (isNaN(itemDate.getTime())) return;

            const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
            const diffTime = today.getTime() - itemDay.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                // Distribute view counts proportionally to the day they were created
                viewsByDay[6 - diffDays] += (material.view_count || 0);
            }
        } catch {
            // Skip items with invalid dates
        }
    });

    return viewsByDay;
}

/**
 * Calculate the sum of an array with validation
 */
export function sumArray(arr: number[]): number {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
}

/**
 * Get the trend direction based on comparison
 */
export function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'neutral' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
}

