import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all groups with member counts
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch groups (filtered by department for execom, all for chairman)
        let query = supabase
            .from('groups')
            .select(`
                *,
                member_count:group_members(count)
            `)
            .order('created_at', { ascending: false });

        // Execom can only see their department's groups
        if (admin.role === 'execom') {
            query = query.eq('department', admin.department);
        }

        const { data: groups, error } = await query;

        if (error) throw error;

        // Transform the data to include member count
        const groupsWithCount = groups?.map(group => ({
            ...group,
            member_count: group.member_count?.[0]?.count || 0
        }));

        return NextResponse.json({ groups: groupsWithCount });
    } catch (error: any) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new custom group
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, department, year, description, color } = body;

        if (!name || !department) {
            return NextResponse.json(
                { error: 'Name and department are required' },
                { status: 400 }
            );
        }

        // Execom can only create groups in their department
        if (admin.role === 'execom' && department !== admin.department) {
            return NextResponse.json(
                { error: 'You can only create groups in your department' },
                { status: 403 }
            );
        }

        // Create the group
        const { data: newGroup, error } = await supabase
            .from('groups')
            .insert({
                name,
                department,
                year: year || null,
                description: description || null,
                color: color || '#06b6d4',
                created_by: user.id,
                is_default: false
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ group: newGroup }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
