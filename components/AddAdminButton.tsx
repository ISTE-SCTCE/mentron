'use client';

import { useState } from 'react';

export function AddAdminButton() {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        position: '',
        department: '',
        role: 'execom',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFeedback(null);

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setFeedback({
                    type: 'success',
                    message: 'Admin added successfully! They can now log in.'
                });
                setFormData({ email: '', position: '', department: '', role: 'execom' });
                setTimeout(() => {
                    setShowForm(false);
                    window.location.reload();
                }, 1500);
            } else {
                setFeedback({
                    type: 'error',
                    message: data.error || 'Failed to add admin'
                });
            }
        } catch (error) {
            setFeedback({
                type: 'error',
                message: 'Network error. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary text-sm w-full sm:w-auto justify-center touch-manipulation"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Admin
            </button>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Add New Admin</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {feedback && (
                            <div className={`mb-4 p-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {feedback.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Position *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="e.g., Secretary, Treasurer"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Department *</label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option value="CSE">Computer Science</option>
                                    <option value="ECE">Electronics & Communication</option>
                                    <option value="EEE">Electrical & Electronics</option>
                                    <option value="ME">Mechanical Engineering</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Role *</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                >
                                    <option value="execom">Execom Member</option>
                                    <option value="chairman">Chairman</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Admin'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={loading}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
