'use client';

import { useState, useEffect } from 'react';
import { DEPARTMENTS, ACADEMIC_YEARS } from '@/lib/constants';

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    color: string;
    member_count?: number;
}

interface ReassignmentResult {
    studentId: string;
    studentName: string;
    success: boolean;
    error?: string;
}

interface BulkReassignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: string[];
    onReassignmentComplete: () => void;
}

export function BulkReassignmentModal({
    isOpen,
    onClose,
    selectedStudentIds,
    onReassignmentComplete
}: BulkReassignmentModalProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ReassignmentResult[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            setSelectedGroupId(null);
            setError(null);
            setResults([]);
            setIsComplete(false);
        }
    }, [isOpen]);

    useEffect(() => {
        // Reset group selection when filters change
        setSelectedGroupId(null);
    }, [selectedYear, selectedDept]);

    async function fetchGroups() {
        try {
            setLoadingGroups(true);
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups || []);
            }
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoadingGroups(false);
        }
    }

    const filteredGroups = groups.filter(group => {
        if (selectedYear && group.year !== selectedYear) return false;
        if (selectedDept && group.department !== selectedDept) return false;
        return true;
    });

    async function handleReassign() {
        if (!selectedGroupId) {
            setError('Please select a target group');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const res = await fetch('/api/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: selectedStudentIds,
                    groupId: selectedGroupId,
                    reason: 'Bulk reassignment'
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Reassignment failed');
            }

            const data = await res.json();

            // Create success results for all students
            const successResults: ReassignmentResult[] = selectedStudentIds.map(id => ({
                studentId: id,
                studentName: `Student ${id.slice(0, 8)}...`,
                success: true
            }));

            setResults(successResults);
            setIsComplete(true);

            // Wait a moment to show results, then complete
            setTimeout(() => {
                onReassignmentComplete();
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Reassignment failed');

            // Mark all as failed
            const failedResults: ReassignmentResult[] = selectedStudentIds.map(id => ({
                studentId: id,
                studentName: `Student ${id.slice(0, 8)}...`,
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            }));
            setResults(failedResults);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={isComplete ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Bulk Reassign Students
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Reassign <span className="font-semibold text-primary-cyan">{selectedStudentIds.length}</span> selected student{selectedStudentIds.length > 1 ? 's' : ''} to a new group
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {!isComplete ? (
                        <>
                            {/* Year Filter */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                    Filter by Year
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedYear(null)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === null
                                                ? 'bg-primary-cyan text-white'
                                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {ACADEMIC_YEARS.map(year => (
                                        <button
                                            key={year.value}
                                            onClick={() => setSelectedYear(year.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === year.value
                                                    ? 'bg-primary-cyan text-white'
                                                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                                }`}
                                        >
                                            {year.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                    Filter by Department
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedDept(null)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedDept === null
                                                ? 'bg-secondary-purple text-white'
                                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {DEPARTMENTS.map(dept => (
                                        <button
                                            key={dept.code}
                                            onClick={() => setSelectedDept(dept.code)}
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                            style={{
                                                backgroundColor: selectedDept === dept.code ? dept.color : 'rgba(255,255,255,0.05)',
                                                color: selectedDept === dept.code ? 'white' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {dept.code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Group Selection */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                    Select Target Group ({filteredGroups.length} available)
                                </label>
                                {loadingGroups ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="p-3 rounded-lg bg-white/5 animate-pulse">
                                                <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                                                <div className="h-3 w-16 bg-white/10 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                        {filteredGroups.length > 0 ? (
                                            filteredGroups.map(group => (
                                                <button
                                                    key={group.id}
                                                    onClick={() => setSelectedGroupId(group.id)}
                                                    className={`p-3 rounded-lg text-left transition-all ${selectedGroupId === group.id
                                                            ? 'ring-2 ring-primary-cyan'
                                                            : 'bg-white/5 hover:bg-white/10'
                                                        }`}
                                                    style={{
                                                        backgroundColor: selectedGroupId === group.id
                                                            ? `${group.color}20`
                                                            : undefined
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: group.color }}
                                                        />
                                                        <span className="font-medium text-[var(--text-primary)]">
                                                            {group.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                        {group.department} • Year {group.year || 'All'}
                                                        {group.member_count !== undefined && ` • ${group.member_count} members`}
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="col-span-2 text-center py-8 text-[var(--text-secondary)]">
                                                <p>No groups match the current filters</p>
                                                <p className="text-sm mt-1">Try adjusting the year or department filter</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Group Preview */}
                            {selectedGroup && (
                                <div className="p-4 rounded-lg bg-primary-cyan/10 border border-primary-cyan/30">
                                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                                        {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} will be reassigned to:
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: selectedGroup.color }}
                                        />
                                        <p className="font-semibold text-[var(--text-primary)]">
                                            {selectedGroup.name} ({selectedGroup.department} - Year {selectedGroup.year || 'All'})
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                                    <span>{error}</span>
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Results View */
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className={`p-4 rounded-lg ${failureCount === 0
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-yellow-500/10 border border-yellow-500/30'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {failureCount === 0 ? (
                                        <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">
                                            {failureCount === 0
                                                ? 'All students reassigned successfully!'
                                                : `${successCount} succeeded, ${failureCount} failed`
                                            }
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {selectedGroup ? `Moved to ${selectedGroup.name}` : 'Reassignment complete'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${(successCount / results.length) * 100}%` }}
                                />
                            </div>

                            {/* Result List */}
                            {failureCount > 0 && (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {results.filter(r => !r.success).map(result => (
                                        <div
                                            key={result.studentId}
                                            className="flex items-center justify-between p-2 rounded-lg bg-red-500/10"
                                        >
                                            <span className="text-sm text-[var(--text-primary)]">{result.studentName}</span>
                                            <span className="text-xs text-red-400">{result.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--glass-border)] flex justify-end gap-3 flex-shrink-0">
                    {!isComplete ? (
                        <>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReassign}
                                disabled={loading || !selectedGroupId}
                                className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Reassigning {selectedStudentIds.length} students...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        Reassign All
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
