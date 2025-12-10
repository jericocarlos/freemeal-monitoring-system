import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

// Fetch free meal logs with employee details
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Change default to 100
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const logType = searchParams.get('log_type') || 'ALL';
    const position = searchParams.get('position') || ''; // Add position filter
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
    
    // Add position filter
    if (position) {
      conditions.push("e.position_id = ?");
      values.push(position);
    }

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

    // Add pagination values
    values.push(limit, offset);

    // Query to fetch logs with pagination
    const query = `
        (
          SELECT 
            l.id, 
            l.date_claimed,
            e.ashima_id,
            e.rfid_tag, 
            e.name, 
            p.name AS position, 
            l.log_type, 
            l.time_claimed, 
            'employee' AS person_type
          FROM freemeal_logs l
          JOIN employees e ON l.ashima_id = e.ashima_id
          LEFT JOIN positions p ON e.position_id = p.id
        )

        UNION ALL

        (
          SELECT 
            l.id, 
            l.date_claimed,
            i.id_number AS ashimia_id,
            i.rfid_tag, 
            i.name, 
            p.name AS position, 
            l.log_type, 
            l.time_claimed, 
            'intern' AS person_type
          FROM freemeal_logs l
          JOIN interns i ON l.ashima_id = i.id_number
          LEFT JOIN positions p ON i.position_id = p.id
        )

        UNION ALL

        (
          SELECT 
            l.id, 
            l.date_claimed,
            t.ashima_id,
            t.rfid_tag, 
            t.name, 
            p.name AS position, 
            l.log_type, 
            l.time_claimed, 
            'trainee' AS person_type
          FROM freemeal_logs l
          JOIN trainees t ON l.ashima_id = t.ashima_id
          LEFT JOIN positions p ON t.position_id = p.id
        )
      ${whereClause}
      ORDER BY time_claimed DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await executeQuery({ query, values });

    // Count total records for pagination
    const countConditions = conditions.length > 0 
      ? "WHERE " + conditions.join(" AND ") 
      : "";
    const countValues = values.slice(0, values.length - 2); // Remove limit and offset

    const countQuery = `
      SELECT COUNT(*) as total
      FROM freemeal_logs l
      LEFT JOIN employees e ON e.ashima_id = l.ashima_id
      LEFT JOIN departments d ON e.department_id = d.id
      ${countConditions}
    `;

    const countResult = await executeQuery({ query: countQuery, values: countValues });
    const total = countResult[0].total;

    return NextResponse.json({ 
      data: logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) 
    });
  } catch (err) {
    console.error("Failed to fetch free meal logs:", err);
    return NextResponse.json(
      { message: `Failed to fetch free meal logs: ${err.message}` },
      { status: 500 }
    );
  }
}