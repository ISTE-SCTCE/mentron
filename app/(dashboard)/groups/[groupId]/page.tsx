import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GroupDetailView } from '@/components/GroupDetailView';

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
    const supabase = await createClient();
    const { groupId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin) redirect('/login');

    let group;
    if (groupId === 'unassigned') {
        group = {
            id: 'unassigned',
            name: 'Unassigned Students',
            department: 'All',
            year: null,
            description: 'Students without a group',
            color: '#FFA500'
        };
    } else {
        const { data } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (!data) notFound();
        group = data;
    }

    // Role Check: Execom should only access their department's groups?
    // User requested Execom "Global Group Management" was implemented.
    // So access is allowed.
    // But if they are restricted by department logic in other places...
    // Current "expanded privileges" allow Execom to see/edit ANY group.
    // So no extra check needed here.

    let query = supabase.from('group_members').select('*').order('created_at', { ascending: false });

    if (groupId === 'unassigned') {
        query = query.is('group_id', null);
    } else {
        query = query.eq('group_id', groupId);
    }

    // Execom restricted to their department for STUDENTS?
    // NO, we removed that restriction in step 516.
    // So Execom sees all students.

    const { data: students } = await query;

    return (
        <DashboardLayout userRole={admin.role as 'chairman' | 'execom'}>
            <GroupDetailView
                group={group}
                students={students || []}
                userRole={admin.role}
            />
        </DashboardLayout>
    );
}
