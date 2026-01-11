import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/student/assignment
 * 
 * Server-side validation endpoint for student group assignment.
 * Returns current group assignment status and details.
 * Used for validating access to group-specific content.
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Assignment API] Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch current assignment with group details
        const { data: assignment, error: fetchError } = await supabase
            .from('group_members')
            .select(`
                id,
                email,
                name,
                department,
                year,
                group_id,
                group:groups(id, name, department, year, color, description)
            `)
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('[Assignment API] Fetch error:', fetchError);

            // User not found in group_members - might be admin or invalid
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Student profile not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to fetch assignment' },
                { status: 500 }
            );
        }

        // Log assignment check for debugging
        console.log(`[Assignment API] User ${user.id} assignment check:`, {
            hasGroup: !!assignment.group_id,
            groupId: assignment.group_id,
            department: assignment.department
        });

        // Build response with access permissions
        const isAssigned = assignment.group_id !== null;
        // Supabase returns array for joins, get first element
        const groupData = Array.isArray(assignment.group) ? assignment.group[0] : assignment.group;
        const group = groupData as {
            id: string;
            name: string;
            department: string;
            year: number;
            color: string;
            description: string | null;
        } | null;

        return NextResponse.json({
            success: true,
            assignment: {
                id: assignment.id,
                email: assignment.email,
                name: assignment.name,
                department: assignment.department,
                year: assignment.year,
                group_id: assignment.group_id,
                group: group
            },
            isAssigned,
            permissions: {
                canAccessMaterials: isAssigned,
                canViewGroupContent: isAssigned,
                materialsDepartment: isAssigned ? group?.department : null,
                materialsYear: isAssigned ? group?.year : null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Assignment API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
