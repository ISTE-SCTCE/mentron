import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is chairman
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin || (admin.role !== 'chairman' && admin.role !== 'execom')) {
            return NextResponse.json({ error: 'Forbidden - Chairman or Execom access required' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { email, position, department, role = 'execom' } = body;

        if (!email || !position || !department) {
            return NextResponse.json({ error: 'Email, position, and department are required' }, { status: 400 });
        }

        // Create auth user with a default password (they should change it)
        const defaultPassword = 'iste@2026'; // Same as your pattern

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
        });

        if (authError) {
            console.error('Auth user creation error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Create admin profile
        const { data: newAdmin, error: adminError } = await supabase
            .from('admins')
            .insert({
                id: authData.user.id,
                email,
                position,
                department,
                role,
                is_active: true,
                can_view_analytics: role === 'chairman' || role === 'execom',
            })
            .select()
            .single();

        if (adminError) {
            console.error('Admin profile creation error:', adminError);
            // Cleanup: delete auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            admin: newAdmin,
            message: `Admin created successfully. Default password: ${defaultPassword}`,
        });

    } catch (error) {
        console.error('Admin creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
