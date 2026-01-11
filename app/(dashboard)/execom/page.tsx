import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatCard } from '@/components/StatCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AnalyticsWidget } from '@/components/ui/AnalyticsWidget';

import { getLast7DaysCounts } from '@/lib/utils/analytics';

export default async function ExecomDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get admin profile
    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin || admin.role !== 'execom') {
        redirect('/login');
    }

    // Parallel fetching for optimized loading
    const [studentsResult, materialsResult, allMaterialsResult] = await Promise.all([
        // Get students in admin's department
        supabase
            .from('group_members')
            .select('created_at')
            .eq('department', admin.department)
            .order('year', { ascending: true }),

        // Get recent materials
        supabase
            .from('materials')
            .select('*')
            .eq('department', admin.department)
            .order('created_at', { ascending: false })
            .limit(10),

        // Get all materials for analytics
        supabase
            .from('materials')
            .select('view_count, created_at')
            .eq('department', admin.department)
    ]);

    const students = studentsResult.data || [];
    const materials = materialsResult.data || [];
    const allMaterials = allMaterialsResult.data || [];

    const totalViews = allMaterials.reduce((sum, m) => sum + (m.view_count || 0), 0);
    const materialCount = allMaterials.length;

    // Calculate real chart data using last 7 days
    const studentChartData = getLast7DaysCounts(students);
    const materialChartData = getLast7DaysCounts(allMaterials);


    const userName = admin.position || admin.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    return (
        <DashboardLayout userRole="execom">
            <main className="relative min-h-screen p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Enhanced Header - Mobile Optimized */}
                    <DashboardHeader
                        userName={userName}
                        subtitle={`${admin.position} - ${admin.department} Department`}
                        userRole="execom"
                        onSignOut={handleSignOut}
                    />

                    {/* Stat Cards Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <StatCard
                            title="Students"
                            value={students.length}
                            trend={{ percentage: 0, direction: 'neutral' }} // Reset trend as we don't have historical snapshots
                            subtitle="In your department"
                            chartData={studentChartData}
                            color="blue"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Materials"
                            value={materialCount}
                            trend={{ percentage: 0, direction: 'neutral' }}
                            subtitle="Uploaded by you"
                            chartData={materialChartData}
                            color="purple"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Messages"
                            value={0}
                            trend={{ percentage: 0, direction: 'neutral' }}
                            subtitle="Unread"
                            chartData={[0, 0, 0, 0, 0, 0, 0]}
                            color="cyan"
                            icon={
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            }
                        />
                    </div>



                    {/* Performance Analytics Widget */}
                    <div className="mb-6 sm:mb-8 flex justify-center sm:justify-start">
                        <AnalyticsWidget
                            title="Department Performance"
                            viewCount={totalViews}
                            viewGrowth="Live Data"
                            secondaryMetricLabel="Avg. Views"
                            secondaryMetricValue={materialCount ? Math.round(totalViews / materialCount) : 0}
                            secondaryMetricGrowth="Real-time"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <Link href="/execom/upload" className="btn btn-primary text-sm justify-center touch-manipulation">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Material
                            </Link>
                            <Link href="/execom/students" className="btn btn-secondary text-sm justify-center touch-manipulation">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                View Students
                            </Link>
                            <Link href="/execom/notifications" className="btn btn-secondary text-sm justify-center touch-manipulation">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                Send Message
                            </Link>
                        </div>
                    </div>

                    {/* Recent Materials */}
                    <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold">Recent Materials</h2>
                    </div>

                    {materials && materials.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {materials.map((material, index) => (
                                <div
                                    key={material.id}
                                    className="glass-card hover:bg-white/10 transition-colors touch-manipulation"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-primary-cyan/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-sm sm:text-base truncate">{material.title}</h3>
                                                <p className="text-text-secondary text-xs sm:text-sm">
                                                    {material.view_count} views • {material.file_type.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={material.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary text-sm w-full sm:w-auto justify-center touch-manipulation"
                                        >
                                            View
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card text-center py-12 sm:py-16">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Materials Yet</h3>
                            <p className="text-text-secondary text-sm sm:text-base mb-4">
                                Upload your first study material to get started.
                            </p>
                            <Link href="/execom/upload" className="btn btn-primary text-sm touch-manipulation">
                                Upload Material
                            </Link>
                        </div>
                    )}

                    {/* Mobile Bottom Padding for Safe Area */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
