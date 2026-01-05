import { executeQuery } from "./db";

/**
 * Generate CSV content for free meal logs using same combined query as export route
 * @param {Object} opts - { search, logType, startDate, endDate }
 * @returns {Promise<{csv: string, filename: string}>}
 */
export async function generateFreemealCsv({ search = '', logType = '', startDate = '', endDate = '', range = '' } = {}) {
  // Support range shortcuts
  if (range === 'previous_week') {
  // lazy import to avoid circular issues
  const { getPreviousWeekRange } = await import('../utils/dateUtils.js');
  const { startDate: s, endDate: e } = getPreviousWeekRange();
  startDate = s;
  endDate = e;
}


  // Build conditions
  let conditions = [];
  const values = [];

  if (search) {
    conditions.push("(ashima_id LIKE ? OR name LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  // date filters
  if (startDate) {
    conditions.push("DATE(time_claimed) >= ?");
    values.push(startDate);
  }

  if (endDate) {
    conditions.push("DATE(time_claimed) <= ?");
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const query = `
    SELECT * FROM (
      (
        SELECT 
          al.id, 
          e.ashima_id, 
          e.name, 
          d.name AS department, 
          p.name AS position, 
          al.log_type,
          al.date_claimed,
          al.time_claimed, 
          'employee' AS person_type
        FROM freemeal_logs al
        JOIN employees e ON al.ashima_id = e.ashima_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN positions p ON e.position_id = p.id
      )

      UNION ALL

      (
        SELECT 
          al.id, 
          i.id_number as ashima_id, 
          i.name, 
          d.name AS department, 
          p.name AS position, 
          al.log_type,
          al.date_claimed,
          al.time_claimed, 
          'intern' AS person_type
        FROM freemeal_logs al
        JOIN interns i ON al.ashima_id = i.id_number
        LEFT JOIN departments d ON i.department_id = d.id
        LEFT JOIN positions p ON i.position_id = p.id
      )

      UNION ALL

      (
        SELECT 
          al.id, 
          t.ashima_id, 
          t.name, 
          d.name AS department, 
          p.name AS position, 
          al.log_type,
          al.date_claimed,
          al.time_claimed, 
          'trainee' AS person_type
        FROM freemeal_logs al
        JOIN trainees t ON al.ashima_id = t.ashima_id
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN positions p ON t.position_id = p.id
      )
    ) AS combined
    ${whereClause}
    ORDER BY time_claimed DESC
  `;

  const logs = await executeQuery({ query, values });

  const headers = ["Date", "Ashima ID", "Employee Name", "Position", "Time Claimed", "Meal Type", "Note"];

  let csvContent = headers.join(',') + "\n";

  logs.forEach(log => {
    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString();
    };

    const formatTime = (datetime) => {
      if (!datetime) return "";
      return new Date(datetime).toLocaleTimeString();
    };

    const row = [
      formatDate(log.date_claimed),
      log.ashima_id || "",
      (log.name || "").replace(/,/g, " "),
      (log.position || "").replace(/,/g, " "),
      formatTime(log.time_claimed),
      log.person_type || "",
      log.log_type || ""
    ];

    csvContent += row.join(',') + "\n";
  });

  const fileLabel = startDate || endDate ? `${startDate || 'start'}_to_${endDate || 'end'}` : new Date().toISOString().split('T')[0];
  const filename = `freemeal_logs_${fileLabel}.csv`;

  return { csv: csvContent, filename };
}
