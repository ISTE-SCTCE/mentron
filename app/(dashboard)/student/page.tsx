import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GroupAssignmentProvider } from '@/components/GroupAssignmentProvider';
import { StudentDashboardClient } from '@/components/StudentDashboardClient';

/**
 * Student Dashboard Page
 * 
 * Server component that:
 * - Authenticates the user
 * - Fetches initial data
 * - Wraps client components with GroupAssignmentProvider for real-time updates
 * 
 * The actual dashboard content is rendered by StudentDashboardClient which
 * handles real-time group assignment changes.
 */
export default async function StudentDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get student profile with group info
    const { data: student } = await supabase
        .from('group_members')
        .select(`
            *,
            group:groups(id, name, department, year, color)
        `)
        .eq('id', user.id)
        .single();

    if (!student) {
        redirect('/login');
    }

    // Check if student is assigned to a group
    const isAssigned = student.group_id !== null;
    const studentGroup = student.group as { id: string; name: string; department: string; year: number; color: string } | null;

    // Get initial materials - only if assigned, filter by group's department and year
    let initialMaterials: any[] = [];
    if (isAssigned && studentGroup) {
        const { data: materialsData } = await supabase
            .from('materials')
            .select('*')
            .eq('department', studentGroup.department)
            .or(`year.eq.${studentGroup.year},year.is.null`)
            .order('created_at', { ascending: false });
        initialMaterials = materialsData || [];
    }

    // Fetch all groups for display
    const { data: allGroups } = await supabase
        .from('groups')
        .select('*')
        .order('name');

    const userName = student.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    // Subtitle based on assignment status
    const subtitle = isAssigned && studentGroup
        ? `${studentGroup.name} • ${studentGroup.department} - Year ${studentGroup.year}`
        : 'Pending Group Assignment';

    return (
        <DashboardLayout userRole="student">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <DashboardHeader
                        userName={userName}
                        subtitle={subtitle}
                        userRole="student"
                        onSignOut={handleSignOut}
                    />

                    {/* Real-time Dashboard Content */}
                    <GroupAssignmentProvider userId={user.id}>
                        <StudentDashboardClient initialMaterials={initialMaterials} allGroups={allGroups || []} />
                    </GroupAssignmentProvider>

                    {/* Mobile Bottom Padding for Safe Area */}
                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
