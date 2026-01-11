import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MaterialViewButton } from '@/components/MaterialViewButton';

/**
 * Student Materials Page
 * 
 * Server component with strict group validation:
 * - Re-verifies group assignment on each load
 * - Redirects unassigned students to dashboard
 * - Filters materials strictly by current group's department and year
 */
export default async function StudentMaterialsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get student profile with fresh group info
    const { data: student, error: studentError } = await supabase
        .from('group_members')
        .select(`
            *,
            group:groups(id, name, department, year, color)
        `)
        .eq('id', user.id)
        .single();

    if (studentError || !student) {
        console.log('[Materials] Student profile not found, redirecting to login');
        redirect('/login');
    }

    // STRICT VALIDATION: Redirect if not assigned to a group
    if (!student.group_id) {
        console.log('[Materials] Student not assigned to group, redirecting to dashboard');
        redirect('/student');
    }

    const studentGroup = student.group as {
        id: string;
        name: string;
        department: string;
        year: number;
        color: string;
    };

    if (!studentGroup) {
        console.log('[Materials] Group data missing despite group_id, redirecting');
        redirect('/student');
    }

    // Get materials - strictly filtered by current group's department and year
    const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('department', studentGroup.department)
        .or(`year.eq.${studentGroup.year},year.is.null`)
        .order('created_at', { ascending: false });

    if (materialsError) {
        console.error('[Materials] Error fetching materials:', materialsError);
    }

    const userName = student.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    return (
        <DashboardLayout userRole="student">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-7xl mx-auto">
                    <DashboardHeader
                        userName={userName}
                        subtitle={`${studentGroup.department} - Year ${studentGroup.year}`}
                        userRole="student"
                        onSignOut={handleSignOut}
                    />

                    {/* Page Title with Group Badge */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Study Materials</h2>
                            <p className="text-text-secondary">
                                Access course materials for your group
                            </p>
                        </div>
                        <span
                            className="px-4 py-2 rounded-full text-sm font-medium self-start flex items-center gap-2"
                            style={{
                                backgroundColor: `${studentGroup.color}20`,
                                color: studentGroup.color,
                                border: `1px solid ${studentGroup.color}40`
                            }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: studentGroup.color }}></span>
                            {studentGroup.name}
                        </span>
                    </div>

                    {/* Materials Grid */}
                    {materials && materials.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {materials.map((material) => (
                                <div
                                    key={material.id}
                                    className="glass-card hover:scale-[1.02] transition-transform touch-manipulation"
                                >
                                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary-cyan/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold mb-1 truncate">{material.title}</h3>
                                            {material.description && (
                                                <p className="text-text-secondary text-sm line-clamp-2">
                                                    {material.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {material.view_count} views
                                        </span>
                                        <span className="uppercase font-semibold">{material.file_type}</span>
                                    </div>

                                    <MaterialViewButton
                                        materialId={material.id}
                                        fileUrl={material.file_url}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card text-center py-16">
                            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold mb-2">No Materials Yet</h3>
                            <p className="text-text-secondary">
                                Study materials for {studentGroup.department} Year {studentGroup.year} will appear here.
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
