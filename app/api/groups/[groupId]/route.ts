import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ groupId: string }>;
}

// PATCH - Update group details
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { groupId } = await params;
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
        const { name, description, color } = body;

        // Fetch the group to check permissions
        const { data: group } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Only group creator or chairman/execom can update
        if (group.created_by !== user.id && admin.role !== 'chairman' && admin.role !== 'execom') {
            return NextResponse.json(
                { error: 'You can only update groups you created' },
                { status: 403 }
            );
        }

        // Update the group
        const { data: updatedGroup, error } = await supabase
            .from('groups')
            .update({
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(color && { color }),
                ...(body.year !== undefined && { year: body.year })
            })
            .eq('id', groupId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ group: updatedGroup });
    } catch (error: any) {
        console.error('Error updating group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete custom group
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { groupId } = await params;
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

        // Fetch the group to check if it's deletable
        const { data: group } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Cannot delete default groups
        if (group.is_default) {
            return NextResponse.json(
                { error: 'Cannot delete default groups' },
                { status: 400 }
            );
        }

        // Only group creator or chairman/execom can delete
        if (group.created_by !== user.id && admin.role !== 'chairman' && admin.role !== 'execom') {
            return NextResponse.json(
                { error: 'You can only delete groups you created' },
                { status: 403 }
            );
        }

        // Unassign all students from this group first
        await supabase
            .from('group_members')
            .update({ group_id: null })
            .eq('group_id', groupId);

        // Delete the group
        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;

        return NextResponse.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
