import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from '@/components/SettingsClient';

export default async function ChairmanSettings() {
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

    return (
        <SettingsClient
            admin={{
                id: admin.id,
                email: admin.email,
                position: admin.position,
                department: admin.department,
                email_notifications: admin.email_notifications,
                desktop_notifications: admin.desktop_notifications,
            }}
            userRole="chairman"
        />
    );
}
