'use client';

// Define Group locally to ensure we catch all needed fields
export interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    description: string | null;
    color: string;
    member_count?: number;
}

interface StudentGroupCardProps {
    group: Group;
    isAssigned: boolean;
    onClick?: () => void;
}

export function StudentGroupCard({ group, isAssigned, onClick }: StudentGroupCardProps) {
    return (
        <div
            onClick={onClick}
            className={`glass-card p-5 transition-all relative overflow-hidden group ${isAssigned
                    ? 'cursor-pointer ring-2 ring-primary-cyan hover:bg-primary-cyan/5 hover:scale-[1.02] shadow-lg shadow-primary-cyan/10'
                    : 'cursor-not-allowed opacity-60 hover:opacity-70 grayscale-[0.8] hover:grayscale-[0.6]'
                }`}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isAssigned ? 'bg-opacity-20' : 'bg-gray-800'
                        }`}
                    style={{ backgroundColor: isAssigned ? `${group.color}20` : undefined }}
                >
                    {isAssigned ? (
                        <svg className="w-6 h-6" style={{ color: group.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`font-semibold text-lg truncate ${isAssigned ? 'text-[var(--text-primary)]' : 'text-gray-400'}`}>
                        {group.name}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm truncate">
                        {group.department} • Year {group.year || 'All'}
                    </p>
                </div>
            </div>

            {/* Active Status Indicator */}
            {isAssigned && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-cyan opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-cyan"></span>
                    </span>
                </div>
            )}

            {/* Visual lock for unassigned */}
            {!isAssigned && (
                <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover:bg-transparent transition-colors" />
            )}
        </div>
    );
}
