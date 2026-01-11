import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AssignmentsClient } from '@/components/assignment/AssignmentsClient';

export default async function ChairmanAssignmentsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check if user is chairman
    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin || admin.role !== 'chairman') {
        redirect('/dashboard');
    }

    return (
        <DashboardLayout userRole="chairman">
            <main className="p-6 sm:p-8 lg:p-10">
                <div className="max-w-6xl mx-auto">
                    <AssignmentsClient userRole="chairman" />
                </div>
            </main>
        </DashboardLayout>
    );
}
