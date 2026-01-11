import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
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

    return (
        <iframe
            src="/landing/"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                margin: 0,
                padding: 0,
                overflow: 'hidden'
            }}
            title="MENTRON Landing Page"
        />
    );
}

