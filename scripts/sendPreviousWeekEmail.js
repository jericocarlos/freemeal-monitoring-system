import cron from "node-cron";
import "./cronEmailJob.js"; 
import nodemailer from "nodemailer";
import { generateFreemealCsv } from '@/lib/reports';

// --- Helper: Calculate previous week's Monday and Sunday ---
function getPreviousWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Last Monday
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - day - 6); // go back to previous week's Monday

  // Last Sunday
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return { start: formatDate(lastMonday), end: formatDate(lastSunday) };
}

// --- Nodemailer setup ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    }
});

// --- Function to send the email ---
async function sendPreviousWeekEmail(csvContent) {
  const { start, end } = getPreviousWeekRange();
  
  // Friendly sender name (defaults to 'Pantry') with configured email
  const fromName = process.env.FROM_NAME;
  const fromAddress = process.env.FROM_EMAIL ? `${fromName} <${process.env.FROM_EMAIL}>` : `${fromName} <no-reply@eastwestbpo>`;
  
  const mailOptions = {
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
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent for week ${start} to ${end}`);
}

// --- Example CSV generation (replace with your real CSV) ---
// function generateCSV() {
//   return `Name,Meal,Date\nJohn Doe,Lunch,2025-12-22\nJane Smith,Dinner,2025-12-23`;
// }
// Generate CSV
    const { csv, filename } = await generateFreemealCsv(params);

// --- Schedule the cron job: every Monday at 12:00 PM ---
// cron.schedule("0 12 * * 1", async () => {
//   const csv = generateCSV();
//   await sendPreviousWeekEmail(csv);
// });
console.log("Scheduled job set to send previous week email every Monday at 12:00 PM.");