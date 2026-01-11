'use client';

import { useState, useEffect } from 'react';

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    color: string;
}

interface Student {
    id: string;
    name?: string | null;
    email: string;
}

interface StudentReassignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    currentGroupId: string | null;
    groups: Group[];
    onSuccess: () => void;
}

export function StudentReassignmentModal({
    isOpen,
    onClose,
    student,
    currentGroupId,
    groups,
    onSuccess
}: StudentReassignmentModalProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('unassigned');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedGroupId(currentGroupId || 'unassigned');
            setError(null);
            setShowSuccess(false);
        }
    }, [isOpen, currentGroupId]);

    const currentGroup = currentGroupId
        ? groups.find(g => g.id === currentGroupId)
        : null;

    async function handleReassign() {
        if (!student) return;

        setLoading(true);
        setError(null);

        const targetGroupId = selectedGroupId === 'unassigned' ? null : selectedGroupId;

        // Don't do anything if no change
        if (targetGroupId === currentGroupId) {
            onClose();
            return;
        }

        try {
            const res = await fetch('/api/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: [student.id],
                    groupId: targetGroupId
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to reassign student');
            }

            // Show success animation
            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reassign student');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !student) return null;

    const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));
    const selectedGroup = selectedGroupId !== 'unassigned'
        ? groups.find(g => g.id === selectedGroupId)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden glass-card">
                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-10 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/30 flex items-center justify-center animate-bounce">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-400 font-medium">Reassignment Successful!</p>
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-[var(--glass-border)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Reassign Student
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Change group for <span className="font-semibold text-primary-cyan">{student.name || student.email}</span>
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Group Display */}
                    <div className="p-4 rounded-lg bg-white/5 border border-[var(--glass-border)]">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                            Current Group
                        </label>
                        {currentGroup ? (
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: currentGroup.color }}
                                />
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">{currentGroup.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        {currentGroup.department} {currentGroup.year ? `• Year ${currentGroup.year}` : ''}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[var(--text-secondary)] italic">Unassigned (No Group)</p>
                        )}
                    </div>

                    {/* Group Selection */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                            Select New Group
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {/* Unassigned Option */}
                            <button
                                onClick={() => setSelectedGroupId('unassigned')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${selectedGroupId === 'unassigned'
                                        ? 'bg-yellow-500/20 ring-2 ring-yellow-500'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="w-4 h-4 rounded-full bg-yellow-500/50 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">Unassigned</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Remove from current group</p>
                                </div>
                            </button>

                            {/* Group Options */}
                            {sortedGroups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroupId(group.id)}
                                    disabled={group.id === currentGroupId}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${selectedGroupId === group.id
                                            ? 'ring-2 ring-primary-cyan'
                                            : group.id === currentGroupId
                                                ? 'opacity-40 cursor-not-allowed bg-white/5'
                                                : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                    style={{
                                        backgroundColor: selectedGroupId === group.id
                                            ? `${group.color}20`
                                            : undefined
                                    }}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: group.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--text-primary)] truncate">
                                            {group.name}
                                            {group.id === currentGroupId && (
                                                <span className="ml-2 text-xs text-[var(--text-secondary)]">(current)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {group.department} {group.year ? `• Year ${group.year}` : ''}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Group Preview */}
                    {selectedGroupId !== (currentGroupId || 'unassigned') && (
                        <div className="p-4 rounded-lg bg-primary-cyan/10 border border-primary-cyan/30">
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Moving to:</p>
                            <div className="flex items-center gap-2">
                                {selectedGroup ? (
                                    <>
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: selectedGroup.color }}
                                        />
                                        <p className="font-semibold text-[var(--text-primary)]">
                                            {selectedGroup.name}
                                        </p>
                                    </>
                                ) : (
                                    <p className="font-semibold text-yellow-400">Unassigned</p>
                                )}
                            </div>
                        </div>
                    )}

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
                </div>

                <div className="p-6 border-t border-[var(--glass-border)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading || showSuccess}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReassign}
                        disabled={loading || showSuccess || selectedGroupId === (currentGroupId || 'unassigned')}
                        className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                            </>
                        ) : 'Confirm Reassignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

