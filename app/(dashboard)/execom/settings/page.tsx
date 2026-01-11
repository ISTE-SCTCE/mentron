import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from '@/components/SettingsClient';

export default async function ExecomSettingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin) {
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
            userRole="execom"
        />
    );
}
