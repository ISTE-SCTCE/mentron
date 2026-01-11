'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';

interface SettingsClientProps {
    admin: {
        id: string;
        email: string;
        position: string;
        department: string;
        email_notifications?: boolean;
        desktop_notifications?: boolean;
    };
    userRole: 'chairman' | 'execom';
}

export function SettingsClient({ admin, userRole }: SettingsClientProps) {
    const supabase = createClient();

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Notification state
    const [emailNotifications, setEmailNotifications] = useState(admin.email_notifications ?? true);
    const [desktopNotifications, setDesktopNotifications] = useState(admin.desktop_notifications ?? false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationFeedback, setNotificationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordFeedback(null);

        // Validation
        if (newPassword.length < 6) {
            setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        setPasswordLoading(true);

        try {
            // First, verify current password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: admin.email,
                password: currentPassword,
            });

            if (signInError) {
                setPasswordFeedback({ type: 'error', message: 'Current password is incorrect' });
                setPasswordLoading(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setPasswordFeedback({ type: 'error', message: updateError.message });
            } else {
                setPasswordFeedback({ type: 'success', message: 'Password updated successfully! Use your new password on next login.' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            setPasswordFeedback({ type: 'error', message: error.message || 'Failed to update password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleNotificationToggle = async (type: 'email' | 'desktop') => {
        setNotificationFeedback(null);
        setNotificationLoading(true);

        const newEmailValue = type === 'email' ? !emailNotifications : emailNotifications;
        const newDesktopValue = type === 'desktop' ? !desktopNotifications : desktopNotifications;

        try {
            const { error } = await supabase
                .from('admins')
                .update({
                    email_notifications: newEmailValue,
                    desktop_notifications: newDesktopValue,
                })
                .eq('id', admin.id);

            if (error) {
                // If columns don't exist, show a message
                if (error.message.includes('column')) {
                    setNotificationFeedback({
                        type: 'error',
                        message: 'Notification preferences not yet configured in database. Please run migration.'
                    });
                } else {
                    setNotificationFeedback({ type: 'error', message: error.message });
                }
            } else {
                if (type === 'email') setEmailNotifications(newEmailValue);
                else setDesktopNotifications(newDesktopValue);
                setNotificationFeedback({ type: 'success', message: 'Preferences saved!' });
                setTimeout(() => setNotificationFeedback(null), 2000);
            }
        } catch (error: any) {
            setNotificationFeedback({ type: 'error', message: error.message || 'Failed to save preferences' });
        } finally {
            setNotificationLoading(false);
        }
    };

    return (
        <DashboardLayout userRole={userRole}>
            <main className="relative min-h-screen p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6">Settings</h1>

                    <div className="space-y-6">
                        {/* Profile Settings */}
                        <div className="glass-card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={admin.email}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Position</label>
                                    <input
                                        type="text"
                                        value={admin.position || 'Admin'}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Department</label>
                                    <input
                                        type="text"
                                        value={admin.department}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
                                    <input
                                        type="text"
                                        value={userRole === 'chairman' ? 'Chairman' : 'Execom Member'}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="glass-card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Change Password
                            </h2>

                            {passwordFeedback && (
                                <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${passwordFeedback.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : 'bg-accent-pink/10 border border-accent-pink/20'
                                    }`}>
                                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${passwordFeedback.type === 'success' ? 'text-green-400' : 'text-accent-pink'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                            passwordFeedback.type === 'success'
                                                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        } />
                                    </svg>
                                    <p className={passwordFeedback.type === 'success' ? 'text-green-400' : 'text-accent-pink'}>
                                        {passwordFeedback.message}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Current Password</label>
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder="Enter your current password"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            placeholder="At least 6 characters"
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Confirm New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder="Re-enter new password"
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showPasswords}
                                            onChange={(e) => setShowPasswords(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-cyan focus:ring-primary-cyan/20"
                                        />
                                        <span className="text-sm text-text-secondary">Show passwords</span>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passwordLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Updating...
                                        </span>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Notification Preferences */}
                        <div className="glass-card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Notification Preferences
                            </h2>

                            {notificationFeedback && (
                                <div className={`mb-4 p-3 rounded-xl text-sm ${notificationFeedback.type === 'success'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-accent-pink/10 text-accent-pink'
                                    }`}>
                                    {notificationFeedback.message}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-text-secondary">Receive email for announcements and updates</p>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('email')}
                                        disabled={notificationLoading}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${emailNotifications ? 'bg-primary-cyan' : 'bg-white/20'
                                            } ${notificationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div>
                                        <p className="font-medium">Desktop Notifications</p>
                                        <p className="text-sm text-text-secondary">Show browser push notifications</p>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('desktop')}
                                        disabled={notificationLoading}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${desktopNotifications ? 'bg-primary-cyan' : 'bg-white/20'
                                            } ${notificationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="glass-card border-red-500/20">
                            <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Danger Zone
                            </h2>
                            <p className="text-sm text-text-secondary mb-4">
                                These actions are irreversible. Please be careful.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        window.location.href = '/';
                                    }}
                                    className="btn bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 justify-center"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile safe area */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
