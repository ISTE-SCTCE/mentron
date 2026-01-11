'use client';

/**
 * Loading skeleton component for dashboard pages
 * Provides immediate visual feedback while content loads
 */

interface LoadingSkeletonProps {
    type?: 'stats' | 'list' | 'chart' | 'card' | 'full';
}

export function LoadingSkeleton({ type = 'full' }: LoadingSkeletonProps) {
    const shimmer = 'animate-pulse bg-white/5';

    if (type === 'stats') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`glass-card !p-4 ${shimmer}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10" />
                            <div className="flex-1">
                                <div className="h-6 w-12 bg-white/10 rounded mb-1" />
                                <div className="h-3 w-20 bg-white/10 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${shimmer}`}>
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="flex-1">
                            <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                            <div className="h-3 w-48 bg-white/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'chart') {
        return (
            <div className={`glass-card ${shimmer}`}>
                <div className="h-4 w-32 bg-white/10 rounded mb-4" />
                <div className="h-48 bg-white/10 rounded" />
            </div>
        );
    }

    if (type === 'card') {
        return (
            <div className={`glass-card ${shimmer}`}>
                <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    // Full page loading
    return (
        <div className="min-h-screen p-6 sm:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className={`h-8 w-48 ${shimmer} rounded mb-2`} />
                        <div className={`h-4 w-32 ${shimmer} rounded`} />
                    </div>
                    <div className={`w-10 h-10 ${shimmer} rounded-full`} />
                </div>

                {/* Stats skeleton */}
                <LoadingSkeleton type="stats" />

                {/* Content skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LoadingSkeleton type="card" />
                    <LoadingSkeleton type="chart" />
                </div>

                {/* List skeleton */}
                <div className="glass-card">
                    <div className={`h-5 w-32 ${shimmer} rounded mb-4`} />
                    <LoadingSkeleton type="list" />
                </div>
            </div>
        </div>
    );
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <svg
            className={`animate-spin ${sizeClasses[size]}`}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/**
 * Page loading overlay
 */
export function PageLoader() {
    return (
        <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-text-secondary text-sm">Loading...</p>
            </div>
        </div>
    );
}
