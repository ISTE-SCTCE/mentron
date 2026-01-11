import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Transfer group(s) between years/departments with audit logging
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
        const {
            group_ids,           // Array of group IDs to transfer
            target_year,         // Target year number (1-4)
            target_department,   // Target department code
            move_students = true, // Whether to move students with the group
            reason               // Optional reason for transfer
        } = body;

        if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
            return NextResponse.json(
                { error: 'At least one group_id is required' },
                { status: 400 }
            );
        }

        if (!target_year && !target_department) {
            return NextResponse.json(
                { error: 'Either target_year or target_department must be provided' },
                { status: 400 }
            );
        }

        // Fetch groups to transfer
        const { data: groups, error: fetchError } = await supabase
            .from('groups')
            .select(`
                *,
                member_count:group_members(count)
            `)
            .in('id', group_ids);

        if (fetchError) throw fetchError;

        if (!groups || groups.length === 0) {
            return NextResponse.json({ error: 'No groups found' }, { status: 404 });
        }

        // Execom can only transfer groups in their department
        if (admin.role === 'execom') {
            const unauthorizedGroups = groups.filter(g => g.department !== admin.department);
            if (unauthorizedGroups.length > 0) {
                return NextResponse.json(
                    { error: 'You can only transfer groups in your department' },
                    { status: 403 }
                );
            }
        }

        const transferResults = [];
        const auditLogs = [];

        for (const group of groups) {
            const from_year = group.year;
            const from_department = group.department;
            const to_year = target_year || group.year;
            const to_department = target_department || group.department;

            // Skip if no change
            if (from_year === to_year && from_department === to_department) {
                continue;
            }

            // Update the group
            const updateData: Record<string, unknown> = {};
            if (target_year) updateData.year = target_year;
            if (target_department) updateData.department = target_department;

            // Try to link to year_id and department_id
            if (target_year) {
                const { data: yearRecord } = await supabase
                    .from('academic_years')
                    .select('id')
                    .eq('year_number', target_year)
                    .single();
                if (yearRecord) updateData.year_id = yearRecord.id;
            }

            if (target_department) {
                const { data: deptRecord } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('code', target_department)
                    .single();
                if (deptRecord) updateData.department_id = deptRecord.id;
            }

            const { data: updatedGroup, error: updateError } = await supabase
                .from('groups')
                .update(updateData)
                .eq('id', group.id)
                .select()
                .single();

            if (updateError) {
                console.error(`Error updating group ${group.id}:`, updateError);
                continue;
            }

            // Move students if requested
            let studentsMoved = 0;
            if (move_students) {
                const updateStudentData: Record<string, unknown> = {};
                if (target_year) updateStudentData.year = target_year;
                if (target_department) updateStudentData.department = target_department;

                const { data } = await supabase
                    .from('group_members')
                    .update(updateStudentData)
                    .eq('group_id', group.id)
                    .eq('group_id', group.id)
                    .select('id');

                studentsMoved = data?.length || 0;
            }

            // Create audit log entry
            const auditLog = {
                group_id: group.id,
                group_name: group.name,
                from_year,
                to_year,
                from_department,
                to_department,
                student_count: group.member_count?.[0]?.count || studentsMoved,
                transferred_by: user.id,
                reason: reason || null,
                details: {
                    move_students,
                    students_moved: studentsMoved,
                    original_group: {
                        id: group.id,
                        name: group.name,
                        description: group.description
                    }
                }
            };

            auditLogs.push(auditLog);
            transferResults.push({
                group: updatedGroup,
                students_moved: studentsMoved
            });
        }

        // Insert audit logs
        if (auditLogs.length > 0) {
            const { error: auditError } = await supabase
                .from('group_transfers')
                .insert(auditLogs);

            if (auditError) {
                console.error('Error creating audit logs:', auditError);
                // Don't fail the whole operation for audit log errors
            }
        }

        return NextResponse.json({
            message: `Successfully transferred ${transferResults.length} group(s)`,
            transfers: transferResults,
            audit_log_count: auditLogs.length
        });
    } catch (error: unknown) {
        console.error('Error transferring groups:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET - Fetch transfer history
export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const groupId = searchParams.get('groupId');

        let query = supabase
            .from('group_transfers')
            .select(`
                *,
                transferred_by_admin:admins!transferred_by(email, department)
            `)
            .order('transferred_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by group if specified
        if (groupId) {
            query = query.eq('group_id', groupId);
        }

        // Execom can only see transfers in their department
        if (admin.role === 'execom') {
            query = query.or(`from_department.eq.${admin.department},to_department.eq.${admin.department}`);
        }

        const { data: transfers, error } = await query;

        if (error) throw error;

        return NextResponse.json({ transfers });
    } catch (error: unknown) {
        console.error('Error fetching transfer history:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
