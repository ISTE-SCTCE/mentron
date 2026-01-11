import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Student Search API - Prefix-based search for student filtering
 * 
 * This endpoint performs PREFIX matching (starts with) specifically for student names.
 * Unlike the dashboard search which uses contains matching (%query%), this endpoint
 * uses query% pattern to only match names that START with the given letters.
 * 
 * Features:
 * - Case-insensitive prefix matching on student name
 * - Optional department filtering via query parameter
 * - Returns up to 10 results for dropdown performance
 * 
 * Query Parameters:
 * - q: The search query (prefix to match)
 * - department: Optional department filter
 * 
 * @example /api/students/search?q=ab - Returns students whose names start with "Ab"
 * @example /api/students/search?q=jo&department=CSE - Returns CSE students whose names start with "Jo"
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const department = searchParams.get('department');

    if (!query) {
        return NextResponse.json({ students: [], message: 'No search query provided' });
    }

    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // PREFIX pattern - matches names starting with the query
        const prefixPattern = `${query}%`;

        // Build the query
        let dbQuery = supabase
            .from('group_members')
            .select('id, name, email, department, year, roll_number, group_id')
            .ilike('name', prefixPattern)
            .order('name', { ascending: true })
            .limit(10);

        // Apply optional department filter
        if (department) {
            dbQuery = dbQuery.eq('department', department);
        }

        const { data: students, error } = await dbQuery;

        if (error) {
            console.error('Student search error:', error);
            return NextResponse.json(
                { error: 'Failed to search students', students: [] },
                { status: 500 }
            );
        }

        return NextResponse.json({
            students: students || [],
            count: students?.length || 0,
            searchType: 'prefix' // Indicates this is prefix matching
        });
    } catch (error) {
        console.error('Student search API error:', error);
        return NextResponse.json(
            { error: 'Search failed', students: [] },
            { status: 500 }
        );
    }
}
