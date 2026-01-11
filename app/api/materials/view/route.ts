import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/materials/view
 * 
 * Increments the view count for a material when a student accesses it.
 * This should be called when the "View Material" button is clicked.
 */
export async function POST(request: Request) {
    try {
        const { materialId } = await request.json();

        if (!materialId) {
            return NextResponse.json(
                { error: 'Material ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get current view count
        const { data: current, error: fetchError } = await supabase
            .from('materials')
            .select('view_count')
            .eq('id', materialId)
            .single();

        if (fetchError) {
            console.error('Fetch material error:', fetchError);
            return NextResponse.json(
                { error: 'Material not found' },
                { status: 404 }
            );
        }

        // Increment view count atomically
        const { error: updateError } = await supabase
            .from('materials')
            .update({ view_count: (current.view_count || 0) + 1 })
            .eq('id', materialId);

        if (updateError) {
            console.error('View count update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update view count' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            newCount: (current.view_count || 0) + 1,
            message: 'View count incremented'
        });

    } catch (error) {
        console.error('View tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to track view' },
            { status: 500 }
        );
    }
}
