'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function ExecomNotificationsPage() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [announcement, setAnnouncement] = useState({
        title: '',
        message: '',
        targetDept: '',
        targetYear: '',
    });
    const [announcementsList, setAnnouncementsList] = useState<any[]>([]);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();
            if (res.ok && data.announcements) {
                setAnnouncementsList(data.announcements);
            }
        } catch (err) {
            console.error('Failed to fetch announcements');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement? This will remove it for everyone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/announcements/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setAnnouncementsList(prev => prev.filter(item => item.id !== id));
                setFeedback({ type: 'success', message: 'Announcement deleted successfully' });
            } else {
                setFeedback({ type: 'error', message: 'Failed to delete announcement' });
            }
        } catch (error) {
            console.error('Delete failed', error);
            setFeedback({ type: 'error', message: 'Delete failed' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFeedback(null);

        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(announcement),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setFeedback({
                    type: 'success',
                    message: `Announcement sent successfully to ${data.recipientsCount} student(s)! ${data.emailSent ? 'Emails delivered.' : 'Email delivery pending.'}`
                });
                setShowCreateForm(false);
                setAnnouncement({ title: '', message: '', targetDept: '', targetYear: '' });
                fetchAnnouncements(); // Refresh list
            } else {
                setFeedback({
                    type: 'error',
                    message: data.error || 'Failed to create announcement'
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
        <DashboardLayout userRole="execom">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Notifications</h2>
                            <p className="text-text-secondary">Manage announcements and notifications</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="btn btn-primary whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            Create Announcement
                        </button>
                    </div>

                    {/* Create Announcement Form */}
                    {showCreateForm && (
                        <form onSubmit={handleSubmit} className="glass-card mb-6">
                            <h3 className="text-xl font-semibold mb-4">New Announcement</h3>

                            {feedback && (
                                <div className={`mb-4 p-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {feedback.message}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={announcement.title}
                                        onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                        placeholder="Announcement title"
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Message *</label>
                                    <textarea
                                        required
                                        value={announcement.message}
                                        onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                        placeholder="Announcement message..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Target Department</label>
                                        <select
                                            value={announcement.targetDept}
                                            onChange={(e) => setAnnouncement({ ...announcement, targetDept: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                        >
                                            <option value="">All Departments</option>
                                            <option value="CSE">Computer Science</option>
                                            <option value="ECE">Electronics & Communication</option>
                                            <option value="EEE">Electrical & Electronics</option>
                                            <option value="ME">Mechanical Engineering</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Target Year</label>
                                        <select
                                            value={announcement.targetYear}
                                            onChange={(e) => setAnnouncement({ ...announcement, targetYear: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                        >
                                            <option value="">All Years</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={loading} className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Announcement
                                            </>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => setShowCreateForm(false)} disabled={loading} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Notifications List */}
                    <div className="glass-card">
                        <h3 className="text-xl font-semibold mb-4">Recent Announcements</h3>
                        <div className="space-y-4">
                            {announcementsList.length === 0 ? (
                                <p className="text-text-secondary">No announcements found.</p>
                            ) : (
                                announcementsList.map((item) => (
                                    <div key={item.id} className="p-4 rounded-lg bg-white/5 border-l-4 border-primary-cyan relative group">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{item.title}</h3>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                                        title="Delete for everyone"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-text-secondary text-sm mb-2">{item.message}</p>
                                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                                    <span>{item.target_department || 'All Depts'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className={item.email_sent ? 'text-green-400' : 'text-yellow-400'}>
                                                        {item.email_sent ? 'Sent via Email' : 'Email Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
