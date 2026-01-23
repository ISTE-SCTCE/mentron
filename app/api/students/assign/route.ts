import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Assign/reassign students to groups with audit logging
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
        const { studentIds, groupId, reason } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: 'studentIds array is required' },
                { status: 400 }
            );
        }

        // Fetch target group info if provided
        let targetGroup = null;
        if (groupId) {
            const { data: group } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (!group) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }

            // Execom can only assign to groups in their department
            if (admin.role === 'execom' && group.department !== admin.department) {
                return NextResponse.json(
                    { error: 'You can only assign students to groups in your department' },
                    { status: 403 }
                );
            }

            targetGroup = group;
        }

        // Fetch current student info for validation and audit log
        const { data: currentStudents } = await supabase
            .from('group_members')
            .select(`
                id,
                email,
                year,
                department,
                group_id,
                group:groups(id, name, department, year)
            `)
            .in('id', studentIds);

        // Check for department mismatch if assigning to a group (not unassigning)
        if (targetGroup && currentStudents) {
            const mismatchedStudents = currentStudents.filter(s => s.department !== targetGroup.department);
            if (mismatchedStudents.length > 0) {
                return NextResponse.json(
                    { error: `Cannot assign students from different departments to '${targetGroup.name}'. Matched students: ${mismatchedStudents.map(s => s.email).join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // Update the students' group_id
        // NOTE: We do NOT update department/year automatically anymore to prevent accidental transfers.
        const updateData: Record<string, unknown> = { group_id: groupId || null };

        const { data: updatedStudents, error } = await supabase
            .from('group_members')
            .update(updateData)
            .in('id', studentIds)
            .select();

        if (error) throw error;

        // Create audit log entries
        if (currentStudents && currentStudents.length > 0) {
            const auditEntries = currentStudents.map(student => {
                const groupData = student.group;
                const fromGroup = (Array.isArray(groupData) ? groupData[0] : groupData) as { id: string; name: string; department: string; year: number } | null;
                return {
                    student_id: student.id,
                    student_email: student.email,
                    from_group_id: student.group_id,
                    from_group_name: fromGroup?.name || null,
                    from_year: student.year,
                    from_department: student.department,
                    to_group_id: groupId || null,
                    to_group_name: targetGroup?.name || null,
                    to_year: targetGroup?.year || student.year,
                    to_department: targetGroup?.department || student.department,
                    assigned_by: user.id,
                    assigned_by_email: admin.email,
                    reason: reason || null,
                    assigned_at: new Date().toISOString()
                };
            });

            // Insert audit logs (don't fail the request if this fails)
            const { error: auditError } = await supabase
                .from('student_assignments')
                .insert(auditEntries);

            if (auditError) {
                console.error('Error creating audit logs:', auditError);
            }
        }

        return NextResponse.json({
            message: `Successfully ${groupId ? 'assigned' : 'unassigned'} ${updatedStudents?.length || 0} student(s)`,
            students: updatedStudents,
            assignedTo: targetGroup ? {
                id: targetGroup.id,
                name: targetGroup.name,
                department: targetGroup.department,
                year: targetGroup.year
            } : null
        });
    } catch (error: unknown) {
        console.error('Error assigning students:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
