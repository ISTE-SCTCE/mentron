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

interface AcademicYear {
    id: string;
    name: string;
    year_number: number;
}

interface Department {
    id: string;
    code: string;
    name: string;
    color: string;
}

interface StudentAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: string[];
    onAssignmentComplete: () => void;
}

export function StudentAssignmentModal({
    isOpen,
    onClose,
    selectedStudentIds,
    onAssignmentComplete
}: StudentAssignmentModalProps) {
    // Use constants directly for years and departments
    const years: AcademicYear[] = ACADEMIC_YEARS.map(y => ({
        id: y.value.toString(),
        name: y.label,
        year_number: y.value
    }));
    const departments: Department[] = DEPARTMENTS.map(d => ({
        id: d.code,
        code: d.code,
        name: d.name,
        color: d.color
    }));

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
        }
    }, [isOpen]);

    useEffect(() => {
        // Reset group selection when filters change
        setSelectedGroupId(null);
    }, [selectedYear, selectedDept]);

    async function fetchGroups() {
        try {
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups || []);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }

    const filteredGroups = groups.filter(group => {
        if (selectedYear && group.year !== selectedYear) return false;
        if (selectedDept && group.department !== selectedDept) return false;
        return true;
    });

    async function handleAssign() {
        if (!selectedGroupId) {
            setError('Please select a group');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: selectedStudentIds,
                    groupId: selectedGroupId,
                    reason: reason || 'Initial assignment'
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Assignment failed');
            }

            onAssignmentComplete();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Assignment failed');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Assign {selectedStudentIds.length} Student{selectedStudentIds.length > 1 ? 's' : ''} to Group
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Select a group to assign the selected students
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Year Filter */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
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
                            {years.map(year => (
                                <button
                                    key={year.id}
                                    onClick={() => setSelectedYear(year.year_number)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === year.year_number
                                        ? 'bg-primary-cyan text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                        }`}
                                >
                                    {year.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
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
                            {departments.map(dept => (
                                <button
                                    key={dept.id}
                                    onClick={() => setSelectedDept(dept.code)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all`}
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
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Select Group ({filteredGroups.length} available)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map(group => (
                                    <button
                                        key={group.id}
                                        onClick={() => setSelectedGroupId(group.id)}
                                        className={`p-3 rounded-lg text-left transition-all ${selectedGroupId === group.id
                                            ? 'ring-2 ring-primary-cyan bg-primary-cyan/10'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
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
                    </div>

                    {/* Selected Group Preview */}
                    {selectedGroup && (
                        <div className="p-4 rounded-lg bg-primary-cyan/10 border border-primary-cyan/30">
                            <p className="text-sm text-[var(--text-secondary)] mb-1">Assigning to:</p>
                            <p className="font-semibold text-[var(--text-primary)]">
                                {selectedGroup.name} ({selectedGroup.department} - Year {selectedGroup.year || 'All'})
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Reason (Optional)
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., New semester registration"
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:border-primary-cyan focus:outline-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--glass-border)] flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedGroupId}
                        className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Assigning...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Assign to Group
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
