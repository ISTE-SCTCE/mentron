import React from 'react';

interface AnalyticsWidgetProps {
    title?: string;
    viewCount: string | number;
    viewGrowth?: string;
    secondaryMetricLabel?: string;
    secondaryMetricValue: string | number;
    secondaryMetricGrowth?: string;
    chartData?: number[];
}

export function AnalyticsWidget({
    title = "Performance Analytics",
    viewCount,
    viewGrowth = "+12.3%",
    secondaryMetricLabel = "Conversions",
    secondaryMetricValue,
    secondaryMetricGrowth = "+8.1%",
    chartData = [40, 60, 75, 45, 85, 65, 95]
}: AnalyticsWidgetProps) {
    // Calculate chart bar heights based on data
    const maxValue = Math.max(...chartData, 1);
    const normalizedData = chartData.map(val => Math.round((val / maxValue) * 100));

    return (
        <div className="group relative flex w-full max-w-sm flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
            <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>

            <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                    </div>

                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Live
                    </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-slate-900/50 p-3">
                        <p className="text-xs font-medium text-slate-400">Total Views</p>
                        <p className="text-lg font-semibold text-white">{viewCount}</p>
                        <span className={`text-xs font-medium ${viewGrowth?.startsWith('-') ? 'text-red-400' : 'text-emerald-500'}`}>
                            {viewGrowth}
                        </span>
                    </div>

                    <div className="rounded-lg bg-slate-900/50 p-3">
                        <p className="text-xs font-medium text-slate-400">{secondaryMetricLabel}</p>
                        <p className="text-lg font-semibold text-white">{secondaryMetricValue}</p>
                        <span className={`text-xs font-medium ${secondaryMetricGrowth?.startsWith('-') ? 'text-red-400' : 'text-emerald-500'}`}>
                            {secondaryMetricGrowth}
                        </span>
                    </div>
                </div>

                {/* Dynamic Chart */}
                <div className="mb-4 h-24 w-full overflow-hidden rounded-lg bg-slate-900/50 p-3">
                    <div className="flex h-full w-full items-end justify-between gap-1">
                        {normalizedData.map((height, index) => (
                            <div
                                key={index}
                                className="w-3 rounded-sm bg-indigo-500/30"
                                style={{ height: `${Math.max(height, 5)}%` }}
                            >
                                <div
                                    className="w-full rounded-sm bg-indigo-500 transition-all duration-300"
                                    style={{ height: `${Math.min(height + 15, 100)}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">Last 7 days</span>
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>

                    <button className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-xs font-medium text-white transition-all duration-300 hover:from-indigo-600 hover:to-purple-600 cursor-pointer">
                        View Details
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

