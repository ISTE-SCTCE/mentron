import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Check if we can read group_members
        const { count, error: countError } = await supabase.from('group_members').select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({ error: 'Could not access group_members', details: countError }, { status: 500 });
        }

        // 2. Perform Updates
        const updates = [
            { old: 'CSE', new: 'Computer Science' },
            { old: 'CS', new: 'Computer Science' },
            { old: 'CS-AIML', new: 'Computer Science with AI & ML' },
            { old: 'CS(AI&ML)', new: 'Computer Science with AI & ML' },
            { old: 'ECE', new: 'Electronics and Communication Engineering' },
            { old: 'ME', new: 'Mechanical Engineering' },
            { old: 'AE', new: 'Mechanical Automobile Engineering' },
            { old: 'MAE', new: 'Mechanical Automobile Engineering' },
            { old: 'BT', new: 'Biotechnology and Biochemical Engineering' },
        ];

        const results = [];

        for (const update of updates) {
            const { data, error } = await supabase
                .from('group_members')
                .update({ department: update.new })
                .eq('department', update.old)
                .select();

            if (error) {
                results.push({ update, status: 'failed', error });
            } else {
                results.push({ update, status: 'success', count: data.length });
            }
        }

        return NextResponse.json({
            message: 'Migration attempted',
            table_access: 'ok',
            total_records: count,
            results
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
