'use client';

import { useState } from 'react';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userDepartment: string;
    userRole?: 'execom' | 'chairman';
}

const COLORS = [
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#eab308' },
];

export function CreateGroupModal({ isOpen, onClose, onSuccess, userDepartment }: CreateGroupModalProps) {
    const [name, setName] = useState('');
    const [year, setYear] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#06b6d4');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    department: userDepartment,
                    year: year || null,
                    description,
                    color
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create group');
            }

            // Reset form
            setName('');
            setYear('');
            setDescription('');
            setColor('#06b6d4');

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Create New Group</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Group Name <span className="text-accent-pink">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Study Group A, Project Team 1"
                            required
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                        />
                    </div>

                    {/* Year (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Year (Optional)
                        </label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                        >
                            <option value="">All Years</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the group's purpose..."
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all resize-none"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Group Color
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`h-10 rounded-lg transition-all ${color === c.value
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
                                        : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-cyan to-secondary-purple hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
