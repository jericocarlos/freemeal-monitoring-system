// app/api/reports/send/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

export async function POST(req) {
  const { to, subject = 'Report', rows } = await req.json();
  const csv = rowsToCsv(rows);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text: 'Attached CSV report',
    attachments: [{ filename: 'report.csv', content: csv, contentType: 'text/csv' }]
  });

  return NextResponse.json({ success: true });
}