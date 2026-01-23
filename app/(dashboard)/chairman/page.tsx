import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatCard } from '@/components/StatCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CalendarWidget } from '@/components/CalendarWidget';
import { AddAdminButton } from '@/components/AddAdminButton';
import { DEPARTMENTS } from '@/lib/constants';

export default async function ChairmanDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get chairman profile
    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin || admin.role !== 'chairman') {
        redirect('/login');
    }

    // Get system-wide stats
    const { count: totalStudents } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true });

    // Helper to get last 7 days dates
    const getLast7Days = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };
    const last7Days = getLast7Days();

    // Helper to process daily counts from records
    const getDailyCounts = (records: any[] | null) => {
        const counts = new Array(7).fill(0);
        records?.forEach(r => {
            const date = r.created_at.split('T')[0];
            const index = last7Days.indexOf(date);
            if (index !== -1) counts[index]++;
        });
        return counts; // Returns array like [0, 1, 0, 2, ...]
    };

    // Calculate Student Growth & Chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch newly created students (Data, not just count)
    const { data: newStudentsData, count: newStudentsCount } = await supabase
        .from('group_members')
        .select('created_at', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

    const studentChartData = getDailyCounts(newStudentsData);

    const { count: totalAdmins } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // Calculate Admin Growth & Chart
    const { data: newAdminsData, count: newAdminsCount } = await supabase
        .from('admins')
        .select('created_at', { count: 'exact' })
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgo.toISOString());

    const adminChartData = getDailyCounts(newAdminsData);

    const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true });

    // Calculate Materials Growth & Chart
    const { data: newMaterialsData, count: newMaterialsCount } = await supabase
        .from('materials')
        .select('created_at', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

    const materialChartData = getDailyCounts(newMaterialsData);

    const { data: totalViews } = await supabase
        .from('materials')
        .select('view_count');

    const viewCount = totalViews?.reduce((sum, m) => sum + (m.view_count || 0), 0) || 0;

    // Helper to calculate percentage growth
    const calculateGrowth = (total: number, newCount: number) => {
        const previous = total - newCount;
        if (previous <= 0) return newCount > 0 ? 100 : 0; // If started from 0, 100% growth
        return Math.round((newCount / previous) * 100);
    };

    const studentGrowth = calculateGrowth(totalStudents || 0, newStudentsCount || 0);
    const adminGrowth = calculateGrowth(totalAdmins || 0, newAdminsCount || 0);
    const materialGrowth = calculateGrowth(totalMaterials || 0, newMaterialsCount || 0);

    // Get all admins for management
    const { data: admins } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch all students (minimal data) for Department Distribution
    const { data: allStudents } = await supabase
        .from('group_members')
        .select('department');



    // Calculate real department distribution from STUDENTS (not admins)
    const departmentCounts = allStudents?.reduce((acc, student) => {
        const dept = student.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const totalCalculatedStudents = allStudents?.length || 1;
    const departmentData = DEPARTMENTS.map(d => ({
        name: d.name,
        count: departmentCounts[d.name] || departmentCounts[d.code] || 0, // Check both name and code for compatibility
        color: `bg-[${d.color}]` // Use arbitrary value syntax for hex colors
    })).filter(d => d.count > 0);

    // Extract user name from email
    const userName = admin.position || admin.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    return (
        <DashboardLayout userRole="chairman">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-7xl mx-auto">
                    {/* Enhanced Header - Mobile Optimized */}
                    <DashboardHeader
                        userName={userName}
                        subtitle={`System overview: ${totalAdmins || 0} active admins today`}
                        userRole="chairman"
                        onSignOut={handleSignOut}
                    />

                    {/* Stat Cards Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
                        <StatCard
                            title="Total Students"
                            value={totalStudents || 0}
                            trend={{ percentage: studentGrowth, direction: 'up' }}
                            subtitle="Across all departments"
                            chartData={studentChartData}
                            color="blue"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Active Admins"
                            value={totalAdmins || 0}
                            trend={{ percentage: adminGrowth, direction: 'up' }}
                            subtitle="Execom members"
                            chartData={adminChartData}
                            color="purple"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Total Materials"
                            value={totalMaterials || 0}
                            trend={{ percentage: materialGrowth, direction: 'up' }}
                            subtitle="All departments"
                            chartData={materialChartData}
                            color="cyan"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Total Views"
                            value={viewCount}
                            // Trend hidden until view history is implemented
                            trend={undefined}
                            subtitle="Total views"
                            chartData={[]} // No view history available
                            color="pink"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Main Content Grid - Mobile First */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
                        {/* Left Column - Admin List (Full width on mobile) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Admin Management */}
                            <div className="glass-card">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-xl sm:text-2xl font-bold">Execom Members</h2>
                                    <AddAdminButton />
                                </div>

                                <div className="space-y-3">
                                    {admins?.map((adminMember) => (
                                        <Link
                                            href={`/chairman/members/${adminMember.id}`}
                                            key={adminMember.id}
                                            className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors touch-manipulation cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-cyan to-secondary-purple flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:shadow-lg group-hover:shadow-primary-cyan/25 transition-shadow">
                                                    {adminMember.email[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-sm sm:text-base truncate group-hover:text-primary-cyan transition-colors">{adminMember.position || 'Admin'}</div>
                                                    <div className="text-text-secondary text-xs sm:text-sm truncate">{adminMember.email}</div>
                                                    <div className="text-text-secondary text-xs hidden sm:block">{adminMember.department}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                                                {adminMember.role === 'chairman' && (
                                                    <span className="px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-primary-cyan/20 to-secondary-purple/20 text-primary-cyan text-xs font-semibold border border-primary-cyan/30 whitespace-nowrap">
                                                        Chairman
                                                    </span>
                                                )}
                                                {adminMember.can_view_analytics && (
                                                    <span className="px-2 sm:px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold whitespace-nowrap hidden sm:inline-block">
                                                        Analytics
                                                    </span>
                                                )}
                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${adminMember.is_active
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {adminMember.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <svg className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Quick Actions & Stats */}
                        <div className="space-y-6">
                            {/* Calendar Widget */}
                            <CalendarWidget userRole="chairman" />

                            {/* Department Distribution */}
                            <div className="glass-card">
                                <h3 className="text-base sm:text-lg font-semibold mb-4">Department Distribution</h3>
                                <div className="space-y-4">
                                    {departmentData.filter(d => d.count > 0).map((dept) => {
                                        const percentage = totalCalculatedStudents > 0 ? (dept.count / totalCalculatedStudents) * 100 : 0;
                                        return (
                                            <div key={dept.name}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">{dept.name}</span>
                                                    <span className="text-sm text-text-secondary">{dept.count} student{dept.count !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${dept.color} transition-all duration-500`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="glass-card">
                                <h3 className="text-base sm:text-lg font-semibold mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <a href="/chairman/students" className="w-full btn btn-secondary justify-start text-sm touch-manipulation">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        View All Students
                                    </a>
                                    <a href="/chairman/analytics" className="w-full btn btn-secondary justify-start text-sm touch-manipulation">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Analytics Dashboard
                                    </a>
                                    <a href="/chairman/settings" className="w-full btn btn-secondary justify-start text-sm touch-manipulation">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        System Settings
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Bottom Padding for Safe Area */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
