import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all academic years with department counts
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch academic years with department counts
        const { data: years, error } = await supabase
            .from('academic_years')
            .select(`
                *,
                department_count:year_departments(count)
            `)
            .order('year_number', { ascending: true });

        if (error) throw error;

        // Transform to include counts
        const yearsWithCounts = years?.map(year => ({
            ...year,
            department_count: year.department_count?.[0]?.count || 0
        }));

        return NextResponse.json({ years: yearsWithCounts });
    } catch (error: unknown) {
        console.error('Error fetching academic years:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST - Create new academic year (Chairman only)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is chairman
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin || admin.role !== 'chairman') {
            return NextResponse.json({ error: 'Only Chairman can create academic years' }, { status: 403 });
        }

        const body = await request.json();
        const { name, year_number, is_active = true } = body;

        if (!name || !year_number) {
            return NextResponse.json(
                { error: 'Name and year_number are required' },
                { status: 400 }
            );
        }

        // Validate year_number is between 1 and 8
        if (year_number < 1 || year_number > 8) {
            return NextResponse.json(
                { error: 'Year number must be between 1 and 8' },
                { status: 400 }
            );
        }

        // Create the academic year
        const { data: newYear, error } = await supabase
            .from('academic_years')
            .insert({
                name,
                year_number,
                is_active
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'An academic year with this name or number already exists' },
                    { status: 409 }
                );
            }
            throw error;
        }

        return NextResponse.json({ year: newYear }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating academic year:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
