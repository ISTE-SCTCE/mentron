import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is an admin (chairman or execom)
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('id, role, department')
            .eq('id', user.id)
            .single();

        if (adminError || !admin) {
            return NextResponse.json({ error: 'Only admins can delete students' }, { status: 403 });
        }

        // Get the student to be deleted
        const { data: student, error: studentError } = await supabase
            .from('group_members')
            .select('*')
            .eq('id', id)
            .single();

        if (studentError || !student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Execom can only delete students from their department
        if (admin.role === 'execom' && student.department !== admin.department) {
            return NextResponse.json({
                error: 'You can only delete students from your department'
            }, { status: 403 });
        }

        // Delete the student from group_members
        const { error: deleteError } = await supabase
            .from('group_members')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
        }

        // Also delete from auth.users if needed (optional - depends on your requirements)
        // Note: This requires admin/service role key
        // const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

        // Create audit log
        try {
            await supabase.from('audit_logs').insert({
                action: 'STUDENT_DELETED',
                performed_by: user.id,
                target_id: id,
                details: {
                    student_email: student.email,
                    student_name: student.name,
                    department: student.department,
                    year: student.year,
                    deleted_by: admin.role
                }
            });
        } catch (auditError) {
            // Don't fail if audit log fails, just log it
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Student deleted successfully'
        });

    } catch (error: any) {
        console.error('Student deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Get a specific student's details with comprehensive information
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Fetch student with group information
        const { data: student, error } = await supabase
            .from('group_members')
            .select(`
                *,
                group:groups(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Fetch assignment history
        const { data: assignmentHistory } = await supabase
            .from('student_assignments')
            .select('*')
            .eq('student_id', id)
            .order('assigned_at', { ascending: false });

        // Count materials viewed (if materials table has student tracking)
        // For now, return 0 as placeholder - can be enhanced when material tracking is implemented
        const materialsViewedCount = 0;

        // Get last activity from assignment history
        const lastActivity = assignmentHistory && assignmentHistory.length > 0
            ? assignmentHistory[0].assigned_at
            : null;

        return NextResponse.json({
            student,
            assignmentHistory: assignmentHistory || [],
            materialsViewedCount,
            lastActivity
        });

    } catch (error: any) {
        console.error('Error fetching student:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
