import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
    // If Supabase is not configured, go directly to landing page
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        redirect('/landing');
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Check if user is an admin
            const { data: admin } = await supabase
                .from('admins')
                .select('role')
                .eq('id', user.id)
                .single();

            if (admin) {
                if (admin.role === 'chairman') redirect('/chairman');
                if (admin.role === 'execom') redirect('/execom');
            }

            // Check if user is a student
            const { data: student } = await supabase
                .from('group_members')
                .select('id')
                .eq('id', user.id)
                .single();

            if (student) {
                redirect('/student');
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback to landing page
    }

    // If no user or auth check fails, redirect to landing page
    redirect('/landing');
}

