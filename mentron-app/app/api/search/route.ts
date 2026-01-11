import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Dashboard Search API - Comprehensive search across all data
 * 
 * This endpoint performs partial matching (contains search) across:
 * - Materials: matches anywhere in title
 * - Groups: matches anywhere in name
 * - Students: matches anywhere in name, email, roll_number, or department
 * 
 * The search is case-insensitive and uses 300ms debounce on the client side.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ materials: [], groups: [], students: [] });
    }

    try {
        const supabase = await createClient();
        const searchPattern = `%${query}%`;

        // Parallel search for Materials, Groups, and Students
        const [materialsResult, groupsResult, studentsResult] = await Promise.all([
            // Materials - partial match on title
            supabase
                .from('materials')
                .select('id, title, subject')
                .ilike('title', searchPattern)
                .limit(5),
            // Groups - partial match on name
            supabase
                .from('groups')
                .select('id, name')
                .ilike('name', searchPattern)
                .limit(5),
            // Students - partial match on name, email, roll_number, or department
            supabase
                .from('group_members')
                .select('id, name, email, department, year, roll_number')
                .or(`name.ilike.${searchPattern},email.ilike.${searchPattern},roll_number.ilike.${searchPattern},department.ilike.${searchPattern}`)
                .limit(5)
        ]);

        // Check for errors
        if (materialsResult.error) {
            console.error('Materials search error:', materialsResult.error);
        }
        if (groupsResult.error) {
            console.error('Groups search error:', groupsResult.error);
        }
        if (studentsResult.error) {
            console.error('Students search error:', studentsResult.error);
        }

        return NextResponse.json({
            materials: materialsResult.data || [],
            groups: groupsResult.data || [],
            students: studentsResult.data || []
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Search failed', materials: [], groups: [], students: [] },
            { status: 500 }
        );
    }
}
