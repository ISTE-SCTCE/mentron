import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Bulk promote students to next year
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
        const { studentIds, targetYear } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: 'studentIds array is required' },
                { status: 400 }
            );
        }

        if (!targetYear || targetYear < 1 || targetYear > 4) {
            return NextResponse.json(
                { error: 'Valid target year (1-4) is required' },
                { status: 400 }
            );
        }

        // Fetch students to verify department permissions
        const { data: students } = await supabase
            .from('group_members')
            .select('*')
            .in('id', studentIds);

        if (!students || students.length === 0) {
            return NextResponse.json({ error: 'No students found' }, { status: 404 });
        }

        // Execom can only promote students in their department
        if (admin.role === 'execom') {
            const invalidStudents = students.filter(s => s.department !== admin.department);
            if (invalidStudents.length > 0) {
                return NextResponse.json(
                    { error: 'You can only promote students in your department' },
                    { status: 403 }
                );
            }
        }

        // For each student, find or create the target year group in their department
        const updatedStudents = [];

        for (const student of students) {
            // Find the default group for this department and target year
            let { data: targetGroup } = await supabase
                .from('groups')
                .select('*')
                .eq('department', student.department)
                .eq('year', targetYear)
                .eq('is_default', true)
                .single();

            // If no default group exists, create it
            if (!targetGroup) {
                const { data: newGroup } = await supabase
                    .from('groups')
                    .insert({
                        name: `${student.department} Year ${targetYear}`,
                        department: student.department,
                        year: targetYear,
                        is_default: true,
                        color: '#06b6d4'
                    })
                    .select()
                    .single();

                targetGroup = newGroup;
            }

            // Update student's year and group
            const { data: updated } = await supabase
                .from('group_members')
                .update({
                    year: targetYear,
                    group_id: targetGroup?.id || null
                })
                .eq('id', student.id)
                .select()
                .single();

            if (updated) {
                updatedStudents.push(updated);
            }
        }

        return NextResponse.json({
            message: `Successfully promoted ${updatedStudents.length} student(s) to Year ${targetYear}`,
            students: updatedStudents
        });
    } catch (error: any) {
        console.error('Error promoting students:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
