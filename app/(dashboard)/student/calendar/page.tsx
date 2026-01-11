import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CalendarWidget } from '@/components/CalendarWidget';

export default async function StudentCalendar() {
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

    return (
        <DashboardLayout userRole="student">
            <main className="relative min-h-screen p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6">Calendar</h1>

                    <div className="grid grid-cols-1 gap-6">
                        <CalendarWidget userRole="student" />
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}
