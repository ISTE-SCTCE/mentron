'use client';

import { useState } from 'react';

interface DeleteStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: {
        id: string;
        name?: string | null;
        email: string;
        department: string;
        year: number;
    } | null;
}

export function DeleteStudentModal({ isOpen, onClose, onSuccess, student }: DeleteStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen || !student) return null;

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/students/${student.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete student');
            }

            onSuccess();
            onClose();
            setConfirmText('');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmText('');
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--card-bg)] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
                {/* Warning Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-center text-red-400 mb-2">Delete Student</h2>
                <p className="text-center text-[var(--text-secondary)] mb-4">
                    This action is permanent and cannot be undone.
                </p>

                {/* Student Info */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                            {(student.name || student.email)?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">{student.name || student.email}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{student.department} • Year {student.year}</p>
                        </div>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Type <span className="text-red-400 font-bold">DELETE</span> to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 transition-all"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-primary)] font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading || confirmText !== 'DELETE'}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Student
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
