import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

interface MemberPageProps {
    params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: MemberPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify user is chairman
    const { data: currentAdmin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!currentAdmin || currentAdmin.role !== 'chairman') {
        redirect('/login');
    }

    // Fetch the member details
    const { data: member, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !member) {
        notFound();
    }

    // Format date
    const joinDate = member.created_at
        ? new Date(member.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown';

    return (
        <DashboardLayout userRole="chairman">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    {/* Back Navigation */}
                    <Link
                        href="/chairman"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-cyan transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>

                    {/* Member Profile Card */}
                    <div className="glass-card mb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary-cyan to-secondary-purple flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-lg shadow-primary-cyan/25">
                                {member.email[0].toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold">{member.position || 'Admin'}</h1>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        {member.role === 'chairman' && (
                                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary-cyan/20 to-secondary-purple/20 text-primary-cyan text-sm font-semibold border border-primary-cyan/30">
                                                Chairman
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.is_active
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-text-secondary mb-1">{member.email}</p>
                                <p className="text-text-secondary text-sm">{member.department} Department</p>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Member Information */}
                        <div className="glass-card">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Member Information
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">Email</span>
                                    <span className="font-medium">{member.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">Position</span>
                                    <span className="font-medium">{member.position || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">Department</span>
                                    <span className="font-medium">{member.department}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">Role</span>
                                    <span className="font-medium capitalize">{member.role}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-text-secondary">Joined</span>
                                    <span className="font-medium">{joinDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="glass-card">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Permissions & Access
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">View Analytics</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${member.can_view_analytics
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {member.can_view_analytics ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                    <span className="text-text-secondary">Account Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${member.is_active
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {member.is_active ? 'Active' : 'Deactivated'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-text-secondary">Role Level</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${member.role === 'chairman'
                                            ? 'bg-primary-cyan/20 text-primary-cyan'
                                            : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                        {member.role === 'chairman' ? 'Full Access' : 'Limited Access'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quick Actions
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                className={`btn ${member.is_active ? 'btn-secondary' : 'btn-primary'}`}
                                disabled
                                title="Coming soon"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={member.is_active
                                        ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                        : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    } />
                                </svg>
                                {member.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled
                                title="Coming soon"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Permissions
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled
                                title="Coming soon"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Message
                            </button>
                        </div>
                        <p className="text-text-secondary text-xs mt-4">
                            * Some actions are disabled for security. Contact system administrator for changes.
                        </p>
                    </div>

                    {/* Mobile safe area */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
