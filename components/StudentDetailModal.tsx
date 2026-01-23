'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';

interface Student {
    id: string;
    email: string;
    name?: string | null;
    roll_number?: string | null;
    department: string;
    year: number;
    created_at: string;
    group_id: string | null;
    group?: {
        id: string;
        name: string;
        color: string;
        department: string;
        year: number | null;
    } | null;
}

interface AssignmentHistory {
    id: string;
    from_group_name: string | null;
    to_group_name: string | null;
    from_department: string;
    to_department: string;
    assigned_by_email: string;
    assigned_at: string;
    reason: string | null;
}

interface StudentDetails {
    student: Student;
    assignmentHistory: AssignmentHistory[];
    materialsViewedCount: number;
    lastActivity: string | null;
}

interface StudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string | null;
    onReassign?: (student: Student) => void;
    onDelete?: (student: Student) => void;
    userRole: 'chairman' | 'execom';
}

export function StudentDetailModal({
    isOpen,
    onClose,
    studentId,
    onReassign,
    onDelete,
    userRole
}: StudentDetailModalProps) {
    const [details, setDetails] = useState<StudentDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudentDetails();
        } else {
            setDetails(null);
        }
    }, [isOpen, studentId]);

    async function fetchStudentDetails() {
        if (!studentId) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/students/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setDetails(data);
            } else {
                showToast('Failed to load student details');
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            showToast('Failed to load student details');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatRelativeTime(dateString: string) {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-deep-bg/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Student Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 glass-panel rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : details ? (
                        <>
                            {/* Profile Section */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                                        style={{
                                            background: details.student.group?.color
                                                ? `linear-gradient(135deg, ${details.student.group.color}, ${details.student.group.color}dd)`
                                                : 'linear-gradient(135deg, #06b6d4, #a855f7)'
                                        }}
                                    >
                                        {(details.student.name || details.student.email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                            {details.student.name || details.student.email.split('@')[0]}
                                        </h3>
                                        <p className="text-text-secondary">{details.student.email}</p>
                                        {details.student.roll_number && (
                                            <p className="text-sm text-text-secondary mt-1">
                                                Roll No: {details.student.roll_number}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl glass-panel">
                                        <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Department</p>
                                        <p className="font-bold text-[var(--text-primary)]">{details.student.department}</p>
                                    </div>
                                    <div className="p-4 rounded-xl glass-panel">
                                        <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Year</p>
                                        <p className="font-bold text-[var(--text-primary)]">Year {details.student.year}</p>
                                    </div>
                                    <div className="p-4 rounded-xl glass-panel">
                                        <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Joined</p>
                                        <p className="font-semibold text-[var(--text-primary)]">
                                            {formatRelativeTime(details.student.created_at)}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {formatDate(details.student.created_at)}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl glass-panel">
                                        <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Last Activity</p>
                                        <p className="font-bold text-[var(--text-primary)]">
                                            {details.lastActivity ? formatRelativeTime(details.lastActivity) : 'No activity'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Group */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-cyan/20 to-primary-cyan/5 border border-primary-cyan/30 shadow-[0_0_20px_rgba(0,163,214,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <h4 className="font-semibold text-[var(--text-primary)]">Current Group</h4>
                                </div>
                                {details.student.group ? (
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="px-3 py-1.5 rounded-lg font-semibold"
                                            style={{
                                                backgroundColor: `${details.student.group.color}20`,
                                                color: details.student.group.color
                                            }}
                                        >
                                            {details.student.group.name}
                                        </span>
                                        <span className="text-sm text-text-secondary">
                                            {details.student.group.department} • {details.student.group.year ? `Year ${details.student.group.year}` : 'All Years'}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-text-secondary">Not assigned to any group</p>
                                )}
                            </div>

                            {/* Activity Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary-purple/20 to-secondary-purple/5 border border-secondary-purple/30 shadow-[0_0_20px_rgba(96,0,192,0.1)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h4 className="font-bold text-[var(--text-primary)]">Materials</h4>
                                    </div>
                                    <p className="text-4xl font-black text-secondary-purple tracking-tight">{details.materialsViewedCount}</p>
                                    <p className="text-xs text-text-secondary mt-1 font-medium">Total documents</p>
                                </div>

                                <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h4 className="font-semibold text-[var(--text-primary)]">Group Changes</h4>
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-500">{details.assignmentHistory.length}</p>
                                    <p className="text-xs text-text-secondary mt-1">Total reassignments</p>
                                </div>
                            </div>

                            {/* Assignment History */}
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Assignment History
                                </h4>
                                {details.assignmentHistory.length > 0 ? (
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {details.assignmentHistory.map((entry, index) => (
                                            <div key={entry.id} className="relative pl-6 pb-3 border-l-2 border-white/10 last:border-transparent">
                                                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary-cyan shadow-[0_0_10px_var(--primary-cyan)]" />
                                                <div className="p-4 rounded-xl glass-panel group">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                                                {entry.from_group_name || 'Unassigned'} → {entry.to_group_name || 'Unassigned'}
                                                            </p>
                                                            <p className="text-xs text-text-secondary mt-1">
                                                                {entry.from_department} → {entry.to_department}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-text-secondary whitespace-nowrap">
                                                            {formatRelativeTime(entry.assigned_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span>By {entry.assigned_by_email}</span>
                                                    </div>
                                                    {entry.reason && (
                                                        <p className="text-xs text-text-secondary mt-2 italic">"{entry.reason}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-secondary">
                                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm">No assignment history</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                {onReassign && (
                                    <button
                                        onClick={() => {
                                            onReassign(details.student);
                                            onClose();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Reassign Student
                                    </button>
                                )}
                                {onDelete && userRole === 'chairman' && (
                                    <button
                                        onClick={() => {
                                            onDelete(details.student);
                                            onClose();
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-text-secondary">
                            <p>Failed to load student details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
