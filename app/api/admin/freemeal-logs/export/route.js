import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const logType = searchParams.get('log_type') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    // Build the search condition
    let conditions = [];
    const values = [];

    // Add search condition
    if (search) {
      conditions.push("(l.ashima_id LIKE ? OR e.name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    // Add log type filter
    // if (logType === 'IN') {
    //   conditions.push("l.out_time IS NULL");
    // } else if (logType === 'OUT') {
    //   conditions.push("l.out_time IS NOT NULL");
    // }

    // Add date range filters
    if (startDate) {
      conditions.push("DATE(l.time_claimed) >= ?");
      values.push(startDate);
    }

    if (endDate) {
      conditions.push("DATE(l.time_claimed) <= ?");
      values.push(endDate);
    }

    // Combine conditions
    const whereClause = conditions.length > 0 
      ? "WHERE " + conditions.join(" AND ") 
      : "";

    // Query to fetch logs for export
    const query = `
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

      ORDER BY time_claimed DESC
    `;

    const logs = await executeQuery({ query, values });

    // Generate CSV content
    const headers = ["Date", "Ashima ID", "Employee Name", "Position", "Time Claimed", "Meal Type", "Note"];
    
    let csvContent = headers.join(",") + "\n";
    
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
        (log.name || "").replace(/,/g, " "), // Replace commas in names
        (log.position || "").replace(/,/g, " "), // Replace commas in position names
        formatTime(log.time_claimed),
        log.person_type || "",
        log.log_type || ""
      ];
      
      csvContent += row.join(",") + "\n";
    });

    // Return CSV as a downloadable file
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="freemeal_logs_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error("Failed to export free meal logs:", error);
    return NextResponse.json(
      { message: "Failed to export free meal logs" },
      { status: 500 }
    );
  }
}