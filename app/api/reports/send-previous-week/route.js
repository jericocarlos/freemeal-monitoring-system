import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateFreemealCsv } from '@/lib/reports';

export async function POST(req) {
  try {
    /* -----------------------------
       Cron authentication
    ------------------------------*/
    const authHeader = req.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* -----------------------------
       Generate CSV (previous week)
    ------------------------------*/
    const { csv, filename } = await generateFreemealCsv({
      range: 'previous_week',
    });

    /* -----------------------------
       Mail transport
    ------------------------------*/
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromName = process.env.FROM_NAME || 'Pantry';
    const fromEmail = process.env.FROM_EMAIL || 'no-reply@eastwestbpo';
    const to = process.env.REPORT_RECIPIENTS;

    if (!to) {
      throw new Error('REPORT_RECIPIENTS is not set');
    }

    /* -----------------------------
       Send email
    ------------------------------*/
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Free Meal Logs – Previous Week`,
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
        {
          filename,
          content: csv,
          contentType: 'text/csv',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Previous week report sent successfully',
    });
  } catch (error) {
    console.error('[SEND_PREVIOUS_WEEK_REPORT]', error);

    return NextResponse.json(
      { error: 'Failed to send report' },
      { status: 500 }
    );
  }
}
