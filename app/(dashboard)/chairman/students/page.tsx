import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GroupManagementClient } from '@/components/GroupManagementClient';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default async function ChairmanStudentsPage() {
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

    if (!admin || admin.role !== 'chairman') {
        redirect('/login');
    }

    // Fetch all students with group information (Chairman sees all)
    let studentsQuery = supabase
        .from('group_members')
        .select(`
            *,
            group:groups(*)
        `)
        .order('created_at', { ascending: false });

    const { data: students } = await studentsQuery;

    // Fetch all groups with member counts
    let groupsQuery = supabase
        .from('groups')
        .select(`
            *,
            member_count:group_members(count)
        `)
        .order('created_at', { ascending: false });

    const { data: groups } = await groupsQuery;

    // Transform groups data to include member count
    const groupsWithCount = groups?.map(group => ({
        ...group,
        member_count: group.member_count?.[0]?.count || 0
    })) || [];

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
                    <DashboardHeader
                        userName={userName}
                        subtitle="Chairman"
                        userRole="chairman"
                        onSignOut={handleSignOut}
                    />

                    <Suspense fallback={<LoadingSkeleton type="card" />}>
                        <GroupManagementClient
                            initialStudents={students || []}
                            initialGroups={groupsWithCount}
                            userDepartment={admin.department}
                            userRole="chairman"
                        />
                    </Suspense>

                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}

