'use client';

import { useState, useEffect } from 'react';

interface Assignment {
    id: string;
    student_id: string;
    student_email: string;
    from_group_name: string | null;
    to_group_name: string | null;
    from_department: string | null;
    to_department: string | null;
    from_year: number | null;
    to_year: number | null;
    assigned_by_email: string;
    reason: string | null;
    assigned_at: string;
}

interface AssignmentHistoryProps {
    limit?: number;
    studentId?: string;
}

export function AssignmentHistory({ limit = 20, studentId }: AssignmentHistoryProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [studentId]);

    async function fetchHistory() {
        try {
            setLoading(true);
            let url = `/api/students/assignments?limit=${limit}`;
            if (studentId) {
                url += `&studentId=${studentId}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAssignments(data.assignments || []);
            }
        } catch (error) {
            console.error('Error fetching assignment history:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-lg bg-white/5 animate-pulse">
                        <div className="h-4 w-64 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-48 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="text-center py-8 text-[var(--text-secondary)]">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium">No Assignment History</p>
                <p className="text-sm mt-1">Assignment logs will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {assignments.map(assignment => (
                <div
                    key={assignment.id}
                    className="p-4 rounded-lg bg-white/5 border border-[var(--glass-border)]"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">
                                {assignment.student_email.split('@')[0]}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs ${assignment.from_group_name
                                        ? 'bg-white/10 text-[var(--text-secondary)]'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {assignment.from_group_name || 'Unassigned'}
                                </span>
                                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className={`px-2 py-0.5 rounded text-xs ${assignment.to_group_name
                                        ? 'bg-primary-cyan/20 text-primary-cyan'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {assignment.to_group_name || 'Unassigned'}
                                </span>
                            </div>
                            {assignment.reason && (
                                <p className="text-xs text-[var(--text-secondary)] mt-2 italic">
                                    &ldquo;{assignment.reason}&rdquo;
                                </p>
                            )}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] text-right flex-shrink-0">
                            <p>{formatDate(assignment.assigned_at)}</p>
                            <p className="mt-0.5">by {assignment.assigned_by_email?.split('@')[0] || 'System'}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
