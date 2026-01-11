'use client';

import { useState, useEffect } from 'react';
import { ACADEMIC_YEARS } from '@/lib/constants';

interface AcademicYear {
    id: string;
    name: string;
    year_number: number;
}

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
    preSelectedYear?: number | null;
}

const GROUP_COLORS = [
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#ef4444', '#6366f1'
];

export function CreateGroupModal({
    isOpen,
    onClose,
    onGroupCreated,
    preSelectedYear
}: CreateGroupModalProps) {
    // Use constants directly instead of API (ensures official departments are always shown)
    const [years] = useState<AcademicYear[]>(
        ACADEMIC_YEARS.map(y => ({
            id: y.value.toString(),
            name: y.label,
            year_number: y.value
        }))
    );
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | null>(preSelectedYear || null);
    const [color, setColor] = useState(GROUP_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form or use pre-selected values
            if (preSelectedYear) setSelectedYear(preSelectedYear);
        }
    }, [isOpen, preSelectedYear]);


    async function handleCreate() {
        if (!name.trim()) {
            setError('Group name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    year: selectedYear,
                    description: description.trim() || null,
                    color
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create group');
            }

            // Reset form
            setName('');
            setDescription('');
            setColor(GROUP_COLORS[0]);

            onGroupCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create group');
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
            <div className="relative w-full max-w-md bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Create New Group
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Add a group to organize students
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Study Group A"
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:border-primary-cyan focus:outline-none"
                        />
                    </div>

                    {/* Year Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Academic Year
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedYear(null)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === null
                                    ? 'bg-primary-cyan text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                    }`}
                            >
                                All Years
                            </button>
                            {years.map((year) => (
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this group..."
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:border-primary-cyan focus:outline-none resize-none"
                        />
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Group Color
                        </label>
                        <div className="flex gap-2">
                            {GROUP_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[var(--deep-bg)]' : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
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
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="px-4 py-2 rounded-lg bg-primary-cyan hover:bg-primary-cyan/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Group
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
