import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SignOutButton } from '@/components/SignOutButton';

export default async function StudentSettingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get student profile
    const { data: student } = await supabase
        .from('group_members')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!student) {
        redirect('/login');
    }

    const userName = student.name || student.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    return (
        <DashboardLayout userRole="student">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    <DashboardHeader
                        userName={userName}
                        subtitle={`${student.department} - Year ${student.year}`}
                        userRole="student"
                        onSignOut={handleSignOut}
                    />

                    {/* Page Title */}
                    <div className="mb-8">
                        <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Profile & Settings</h2>
                        <p className="text-text-secondary">
                            Manage your account information and preferences
                        </p>
                    </div>

                    {/* Profile Information */}
                    <div className="glass-card mb-6">
                        <h3 className="text-xl font-semibold mb-6">Profile Information</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={student.name || ''}
                                        disabled
                                        placeholder="Not set"
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Roll Number</label>
                                    <input
                                        type="text"
                                        value={student.roll_number || ''}
                                        disabled
                                        placeholder="Not set"
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                                <input
                                    type="email"
                                    value={student.email}
                                    disabled
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary cursor-not-allowed"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Department</label>
                                    <input
                                        type="text"
                                        value={student.department}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Year</label>
                                    <input
                                        type="text"
                                        value={`Year ${student.year}`}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-text-primary cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="glass-card mb-6">
                        <h3 className="text-xl font-semibold mb-6">Change Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Current Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                            </div>
                            <button className="btn btn-primary">
                                Update Password
                            </button>
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="glass-card mb-6">
                        <h3 className="text-xl font-semibold mb-6">Notification Preferences</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm">Email notifications for new materials</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-white/5 border-white/10 text-primary-cyan focus:ring-primary-cyan" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm">Email notifications for announcements</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-white/5 border-white/10 text-primary-cyan focus:ring-primary-cyan" />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm">Email notifications for events</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-white/5 border-white/10 text-primary-cyan focus:ring-primary-cyan" />
                            </label>
                        </div>
                    </div>

                    {/* Sign Out Section */}
                    <div className="glass-card border-red-500/20">
                        <h3 className="text-xl font-semibold mb-4 text-red-400">Sign Out</h3>
                        <p className="text-text-secondary text-sm mb-4">
                            Sign out of your account on this device. You&apos;ll need to log in again to access your dashboard.
                        </p>
                        <SignOutButton />
                    </div>

                    {/* Mobile Bottom Padding */}
                    <div className="h-24 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}

