//import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateFreemealCsv } from '../lib/reports.js';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow certain roles to send reports
    const allowedRoles = ['superadmin', 'admin', 'hr'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, subject = '', search = '', log_type = '', start_date = '', end_date = '', range = '' } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient (to) is required' }, { status: 400 });
    }

    // If caller passed range='previous_week' or start_date='previous_week', use the range
    const useRange = range === 'previous_week' || start_date === 'previous_week' || end_date === 'previous_week';
    const params = useRange ? { search, logType: log_type, range: 'previous_week' } : { search, logType: log_type, startDate: start_date, endDate: end_date };

    console.log('Generating Free Meal CSV with params:', params);
    
    // Generate CSV
    const { csv, filename } = await generateFreemealCsv(params);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    // Friendly sender name (defaults to 'Pantry') with configured email
    const fromName = process.env.FROM_NAME;
    const fromAddress = process.env.FROM_EMAIL ? `${fromName} <${process.env.FROM_EMAIL}>` : `${fromName} <no-reply@eastwestbpo>`;

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: subject || `Free Meal Logs - ${new Date().toLocaleDateString()}`,
      html: `
            <p>Good Day,</p>

            <p>
              Attached is the <strong>Free Meal Logs CSV Report</strong> for the <strong>previous week
              (Monday through Sunday)</strong>.
            </p>

            <p>
              This report is <strong>sent every Monday at 12:00 PM.</strong>
            </p>

            <p>
              Please review the attached CSV file for detailed information on free meal claims made during this period.
            </p>

            <p>Thank you.</p>
            `,

      attachments: [
        { filename, content: csv, contentType: 'text/csv' }
      ]
    });

    return NextResponse.json({ success: true, message: 'Report emailed successfully' });
  } catch (error) {
    console.error('Failed to send free meal report via email:', error);
    return NextResponse.json({ error: 'Failed to send free meal report' }, { status: 500 });
  }
}
