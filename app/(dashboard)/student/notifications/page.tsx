'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Announcement {
    id: string;
    title: string;
    message: string;
    priority: 'normal' | 'high' | 'urgent';
    created_at: string;
    target_department: string | null;
    target_year: number | null;
}

export default function StudentNotificationsPage() {
    // Note: We're fetching user data client-side here for simplicity in this specific page context,
    // or we could pass it down. Assuming the Header/Layout handles the main auth checks or we add a check.
    // For consistency with other client components, we'll fetch notifications.
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();
                if (res.ok && data.announcements) {
                    setAnnouncements(data.announcements);
                }
            } catch (error) {
                console.error('Failed to fetch announcements', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const userRole = 'student'; // Fixed for this page

    return (
        <DashboardLayout userRole={userRole}>
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header integration handled efficiently */}
                    <DashboardHeader
                        userName="Student"
                        subtitle="Notifications"
                        userRole={userRole}
                    />

                    {/* Page Title */}
                    <div className="mb-8 mt-4">
                        <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Notifications</h2>
                        <p className="text-text-secondary">
                            Stay updated with announcements and important information
                        </p>
                    </div>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-text-secondary">Loading updates...</p>
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="space-y-4">
                            {announcements.map((item) => (
                                <div
                                    key={item.id}
                                    className={`glass-card hover:bg-white/5 transition-all ${item.priority === 'urgent' ? 'border-l-4 border-red-500' :
                                            item.priority === 'high' ? 'border-l-4 border-orange-500' :
                                                'border-l-4 border-primary-cyan'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${item.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                                'bg-cyan-500/20 text-cyan-400'
                                            }`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                                {item.priority !== 'normal' && (
                                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${item.priority === 'urgent' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                                                        }`}>
                                                        {item.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-text-secondary text-sm mb-2">
                                                {item.message}
                                            </p>
                                            <span className="text-xs text-text-secondary">
                                                {new Date(item.created_at).toLocaleDateString()}
                                                {item.target_department && ` • ${item.target_department}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card text-center py-16">
                            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                            <p className="text-text-secondary">
                                You're all caught up! New notifications will appear here.
                            </p>
                        </div>
                    )}

                    {/* Mobile Bottom Padding */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
