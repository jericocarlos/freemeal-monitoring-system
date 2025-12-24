Weekly Report script

This folder contains `generate-weekly-report.js`, which:
- Computes the previous week's Monday-Sunday date range
- Calls the `/api/admin/freemeal-logs/export` endpoint with `start_date` and `end_date`
- Saves the resulting CSV to `exports/freemeal_logs_<start>_to_<end>.csv`
- Optionally emails the CSV using SMTP

Environment variables:
- REPORT_BASE_URL (default: http://localhost:3000)
- REPORT_TO (comma-separated emails) — required to send email
- REPORT_FROM (defaults to no-reply@<base-host>)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE
- REPORT_SUBJECT (optional)

Run locally:

REPORT_BASE_URL=http://localhost:3000 REPORT_TO="admin@example.com" REPORT_FROM="no-reply@example.com" SMTP_HOST=smtp.example.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... npm run generate-weekly-report

Run as a persistent cron process:

- Start the cron runner manually (for testing):
  npm run weekly-cron

- To run it as a persistent background service, use PM2 or systemd.
  Example with PM2:
    npm i -g pm2
    pm2 start npm --name weekly-cron -- run weekly-cron

  Example systemd unit (create /etc/systemd/system/weekly-cron.service):
    [Unit]
    Description=Weekly Free Meal Report Cron
    After=network.target

    [Service]
    Type=simple
    WorkingDirectory=/path/to/your/app
    ExecStart=/usr/bin/npm run weekly-cron
    Restart=on-failure
    Environment=REPORT_BASE_URL=http://localhost:3000
    Environment=REPORT_TO=admin@example.com
    Environment=REPORT_FROM=no-reply@example.com
    # Add SMTP env vars here as well

    [Install]
    WantedBy=multi-user.target

  Then enable + start:
    sudo systemctl enable weekly-cron
    sudo systemctl start weekly-cron

GitHub Actions

- Add the following repository secrets: REPORT_BASE_URL, REPORT_TO, REPORT_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE (optional)
- The included workflow `/.github/workflows/weekly-report.yml` runs every Monday at 12:00 (Asia/Manila / UTC+8) by triggering at 04:00 UTC.