import { Resend } from 'resend';

// Lazy initialization to prevent build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

export interface AnnouncementEmailData {
    to: string[];
    subject: string;
    title: string;
    message: string;
    priority?: string;
    senderName: string;
    senderRole: string;
}

export async function sendAnnouncementEmail(data: AnnouncementEmailData) {
    const { to, subject, title, message, priority = 'normal', senderName, senderRole } = data;

    const priorityBadge = priority === 'urgent' ? '🔴 URGENT' : priority === 'high' ? '🟠 HIGH PRIORITY' : '';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #00C6FF 0%, #7000DF 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                .priority-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                }
                .content {
                    padding: 20px 0;
                    border-bottom: 1px solid #eee;
                }
                .message {
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 16px 0;
                    white-space: pre-wrap;
                }
                .footer {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 14px;
                    color: #666;
                }
                .sender {
                    font-weight: 600;
                    color: #00C6FF;
                }
                .cta-button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #00C6FF 0%, #7000DF 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    margin-top: 16px;
                }
                .logo {
                    font-size: 20px;
                    font-weight: 900;
                    color: #00C6FF;
                    margin-bottom: 16px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">MENTRON</div>
                <div class="header">
                    ${priorityBadge ? `<div class="priority-badge">${priorityBadge}</div>` : ''}
                    <h1>📢 ${title}</h1>
                </div>
                
                <div class="content">
                    <div class="message">${message}</div>
                </div>
                
                <div class="footer">
                    <p><strong>From:</strong> <span class="sender">${senderName}</span> (${senderRole})</p>
                    <p><strong>Sent:</strong> ${new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'short'
    })}</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">
                        View in Dashboard →
                    </a>
                    
                    <p style="margin-top: 24px; font-size: 12px; color: #999;">
                        This is an automated message from MENTRON - ISTE SWAS Academic Platform.
                        <br>You received this because you are a registered member.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const result = await getResendClient().emails.send({
            from: `MENTRON <${process.env.RESEND_FROM_EMAIL || 'istesctce@gmail.com'}>`,
            to,
            subject,
            html: htmlContent,
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}
