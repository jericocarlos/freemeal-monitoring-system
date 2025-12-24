/*
Weekly cron runner that schedules the weekly report generation.
This script uses node-cron and should be run as a long-lived process using PM2, systemd, or similar.

Runs: Every Monday at 12:00 Asia/Manila (UTC+8)
*/

const cron = require('node-cron');
const { generateWeeklyReport } = require('./generate-weekly-report');

const JOB_SCHEDULE = '0 12 * * 1'; // 12:00 every Monday
const JOB_TIMEZONE = 'Asia/Manila';

console.log(`Starting weekly report cron job: schedule=${JOB_SCHEDULE} timezone=${JOB_TIMEZONE}`);

cron.schedule(JOB_SCHEDULE, async () => {
  console.log(`Cron triggered at ${new Date().toISOString()} — generating weekly report...`);
  try {
    await generateWeeklyReport();
    console.log('Weekly report job finished successfully.');
  } catch (err) {
    console.error('Weekly report cron job failed:', err);
  }
}, {
  timezone: JOB_TIMEZONE
});

// Keep process alive
console.log('Weekly cron runner is now active.');

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down weekly cron runner.');
  process.exit(0);
});
