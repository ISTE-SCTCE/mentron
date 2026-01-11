import { createClient } from '@/lib/supabase/server';
import { sendAnnouncementEmail } from '@/lib/email/resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is execom or chairman
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { title, message, priority = 'normal', targetDept, targetYear } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Create announcement in database
        const { data: announcement, error: announcementError } = await supabase
            .from('announcements')
            .insert({
                title,
                message,
                priority,
                created_by: user.id,
                target_department: targetDept || null,
                target_year: targetYear ? parseInt(targetYear) : null,
            })
            .select()
            .single();

        if (announcementError) {
            console.error('Announcement creation error:', announcementError);
            return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
        }

        // Get recipients based on target audience
        let recipientsQuery = supabase
            .from('group_members')
            .select('email, department, year');

        if (targetDept) {
            recipientsQuery = recipientsQuery.eq('department', targetDept);
        }

        if (targetYear) {
            recipientsQuery = recipientsQuery.eq('year', parseInt(targetYear));
        }

        const { data: recipients, error: recipientsError } = await recipientsQuery;

        if (recipientsError) {
            console.error('Recipients fetch error:', recipientsError);
            return NextResponse.json({
                success: true,
                announcement,
                warning: 'Announcement created but failed to fetch recipients'
            });
        }

        // Send emails
        if (recipients && recipients.length > 0) {
            const emailAddresses = recipients.map(r => r.email);

            const emailSubject = priority === 'urgent'
                ? `🔴 URGENT: ${title}`
                : priority === 'high'
                    ? `🟠 Important: ${title}`
                    : `📢 ${title}`;

            const emailResult = await sendAnnouncementEmail({
                to: emailAddresses,
                subject: emailSubject,
                title,
                message,
                priority,
                senderName: admin.position || admin.email.split('@')[0],
                senderRole: admin.role === 'chairman' ? 'Chairman' : 'Execom Member',
            });

            // Update announcement with email status
            await supabase
                .from('announcements')
                .update({
                    email_sent: emailResult.success,
                    recipients_count: emailAddresses.length,
                })
                .eq('id', announcement.id);

            return NextResponse.json({
                success: true,
                announcement,
                emailSent: emailResult.success,
                recipientsCount: emailAddresses.length,
            });
        }

        return NextResponse.json({
            success: true,
            announcement,
            emailSent: false,
            recipientsCount: 0,
            message: 'No recipients found for the specified criteria',
        });

    } catch (error) {
        console.error('Announcement API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all announcements
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select(`
                *,
                admins:created_by (
                    email,
                    position,
                    role
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch announcements error:', error);
            return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
        }

        return NextResponse.json({ announcements });

    } catch (error) {
        console.error('Announcements GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
