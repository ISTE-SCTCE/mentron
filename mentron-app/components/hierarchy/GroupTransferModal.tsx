'use client';

import { useState, useEffect } from 'react';

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
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

interface GroupTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
    onTransferComplete: () => void;
}

export function GroupTransferModal({
    isOpen,
    onClose,
    groups,
    onTransferComplete
}: GroupTransferModalProps) {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [targetYear, setTargetYear] = useState<number | null>(null);
    const [targetDepartment, setTargetDepartment] = useState<string | null>(null);
    const [moveStudents, setMoveStudents] = useState(true);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchYears();
            fetchDepartments();
        }
    }, [isOpen]);

    async function fetchYears() {
        try {
            const res = await fetch('/api/academic-years');
            if (res.ok) {
                const data = await res.json();
                setYears(data.years || []);
            }
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    }

    async function fetchDepartments() {
        try {
            const res = await fetch('/api/departments');
            if (res.ok) {
                const data = await res.json();
                setDepartments(data.departments || []);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }

    async function handleTransfer() {
        if (!targetYear && !targetDepartment) {
            setError('Please select a target year or department');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/groups/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_ids: groups.map(g => g.id),
                    target_year: targetYear,
                    target_department: targetDepartment,
                    move_students: moveStudents,
                    reason
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Transfer failed');
            }

            onTransferComplete();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transfer failed');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Transfer {groups.length} Group{groups.length > 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Move groups to a different year or department
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Groups being transferred */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Groups to Transfer
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {groups.map(group => (
                                <span
                                    key={group.id}
                                    className="px-3 py-1 bg-white/10 rounded-full text-sm text-[var(--text-primary)]"
                                >
                                    {group.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Target Year */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Target Year
                        </label>
                        <select
                            value={targetYear || ''}
                            onChange={(e) => setTargetYear(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] focus:border-primary-cyan focus:outline-none"
                        >
                            <option value="">Keep current year</option>
                            {years.map(year => (
                                <option key={year.id} value={year.year_number}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Department */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Target Department
                        </label>
                        <select
                            value={targetDepartment || ''}
                            onChange={(e) => setTargetDepartment(e.target.value || null)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] focus:border-primary-cyan focus:outline-none"
                        >
                            <option value="">Keep current department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.code}>
                                    {dept.code} - {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Move Students Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                Move Students
                            </label>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Also update student records to match new year/department
                            </p>
                        </div>
                        <button
                            onClick={() => setMoveStudents(!moveStudents)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${moveStudents ? 'bg-primary-cyan' : 'bg-white/20'
                                }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moveStudents ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for transfer..."
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:border-primary-cyan focus:outline-none resize-none"
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
                <div className="p-6 border-t border-[var(--glass-border)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={loading || (!targetYear && !targetDepartment)}
                        className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Transferring...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Transfer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
