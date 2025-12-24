/*
Generates the CSV report for the previous week (Mon - Sun) and emails it to configured recipients.
Environment variables:
  REPORT_BASE_URL - base URL of app (default http://localhost:3000)
  REPORT_TO - comma separated recipient emails (required to send email)
  REPORT_FROM - from email address
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE - nodemailer SMTP settings

This script is intended to be run by cron or CI (e.g., GitHub Actions).
*/

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const fetch = global.fetch;

if (!fetch) {
  console.error('Global fetch is not available in this Node version. Please use Node 18+ or run inside an environment that provides fetch.');
  process.exit(1);
}

const BASE_URL = process.env.REPORT_BASE_URL || 'http://localhost:3000';
const REPORT_TO = process.env.REPORT_TO || '';
const REPORT_FROM = process.env.REPORT_FROM || `no-reply@${new URL(BASE_URL).hostname}`;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = (process.env.SMTP_SECURE || 'false') === 'true';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function previousWeekRange(refDate = new Date()) {
  // Find Monday of the current week (ISO-like where Monday is day 1)
  const d = new Date(refDate);
  const day = d.getDay(); // 0 (Sun) .. 6 (Sat)
  // Calculate offset to Monday of current week
  const offsetToMonday = ((day + 6) % 7);
  const mondayThisWeek = new Date(d);
  mondayThisWeek.setDate(d.getDate() - offsetToMonday);

  const prevMonday = new Date(mondayThisWeek);
  prevMonday.setDate(mondayThisWeek.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);

  return { start: formatDate(prevMonday), end: formatDate(prevSunday) };
}

async function fetchCsv(startDate, endDate) {
  const url = `${BASE_URL}/api/admin/freemeal-logs/export?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  console.log(`Fetching CSV from: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${await res.text()}`);
  }
  return await res.text();
}

async function sendEmail({ to, from, subject, text, attachments }) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration missing in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    attachments
  });

  return info;
}

async function main() {
  try {
    const { start, end } = previousWeekRange();
    console.log(`Generating report for ${start} to ${end}`);

    const csv = await fetchCsv(start, end);

    // ensure exports dir
    const outDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const filename = `freemeal_logs_${start}_to_${end}.csv`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, csv);

    console.log(`Saved CSV to ${filePath}`);

    if (!REPORT_TO) {
      console.log('REPORT_TO not set — skipping email send.');
      return;
    }

    const recipients = REPORT_TO.split(',').map(s => s.trim()).filter(Boolean);

    const subject = process.env.REPORT_SUBJECT || `FreeMeal Weekly Report: ${start} to ${end}`;
    const text = `Please find attached the free meal logs for ${start} to ${end}.`;

    const info = await sendEmail({
      to: recipients,
      from: REPORT_FROM,
      subject,
      text,
      attachments: [
        { filename, path: filePath }
      ]
    });

    console.log('Email sent:', info.messageId || info);
  } catch (err) {
    console.error('Failed to generate or send weekly report:', err);
    process.exitCode = 1;
  }
}

module.exports = { generateWeeklyReport: main, previousWeekRange };

if (require.main === module) {
  main();
}
