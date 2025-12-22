import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request) {
  try {
    const { rfid_tag, ashima_id, time_claimed } = await request.json();

    // Allow searching by either RFID tag or ashima_id
    const searchParam = ashima_id ?? rfid_tag;
    if (!searchParam) {
      return NextResponse.json(
        { error: 'rfid_tag or ashima_id is required.' },
        { status: 400 }
      );
    }

    console.log("Received request with:", { rfid_tag, ashima_id, time_claimed });

    // Normalize time_claimed if provided
    const timeParamRaw = time_claimed ? String(time_claimed).replace('T', ' ') : null;
    const timeForQueries = timeParamRaw || new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log("timeForQueries:", timeForQueries);
    console.log("timeParamRaw:", timeParamRaw);

    // Find person by either rfid or id (employees/interns/trainees)
    const employeeQuery = `
      SELECT 
          e.id AS person_id,
          e.ashima_id,
          e.name,
          d.name AS department,
          p.name AS position,
          e.photo,
          e.status,
          'employee' AS person_type,
          e.meal_count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.rfid_tag = ? OR e.ashima_id = ?

      UNION ALL

      SELECT 
          i.id AS person_id,
          i.id_number as ashima_id,
          i.name,
          d.name AS department,
          p.name AS position,
          i.photo,
          i.status,
          'intern' AS person_type,
          null as meal_count
      FROM interns i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN positions p ON i.position_id = p.id
      WHERE i.rfid_tag = ? OR i.id_number = ?

      UNION ALL

      SELECT 
          t.id AS person_id,
          t.ashima_id,
          t.name,
          d.name AS department,
          p.name AS position,
          t.photo,
          t.status,
          'trainee' AS person_type,
          null as meal_count
      FROM trainees t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN positions p ON t.position_id = p.id
      WHERE t.rfid_tag = ? OR t.ashima_id = ?;
    `;

    const [employee] = await executeQuery({
      query: employeeQuery,
      values: [searchParam, searchParam, searchParam, searchParam, searchParam, searchParam],
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Person not found for provided identifier.' },
        { status: 404 }
      );
    }

    if (employee.photo) {
      employee.photo = `data:image/png;base64,${Buffer.from(employee.photo).toString('base64')}`;
    }

    // Find latest log for the target date (DATE(time_claimed) = DATE(provided_time))
    const latestLogQuery = `
      SELECT * FROM freemeal_logs
      WHERE ashima_id = ?
      AND DATE(time_claimed) = DATE(?)
      ORDER BY time_claimed DESC
      LIMIT 1
    `;

    const [latestLog] = await executeQuery({
      query: latestLogQuery,
      values: [employee.ashima_id, timeForQueries],
    });

    let nextLogType = "CLAIMED";
    let insertLogQuery = "";
    let insertLogValues = [];

    const today = timeParamRaw ? new Date(timeParamRaw) : new Date();
    const claimedDate = new Date(latestLog?.time_claimed);

    console.log("🕒 Processing free meal log for:", employee.name, "on", today.toDateString());

    const isSameDay = latestLog &&
      claimedDate.getDate() === today.getDate() &&
      claimedDate.getMonth() === today.getMonth() &&
      claimedDate.getFullYear() === today.getFullYear();

    if (!latestLog || !isSameDay) {
      // No log for that day → create a CLAIMED (use provided time if present)
      nextLogType = "CLAIMED";
      if (timeParamRaw) {
        insertLogQuery = `
          INSERT INTO freemeal_logs (date_claimed, ashima_id, log_type, time_claimed, meal_type)
          VALUES (DATE(?), ?, 'CLAIMED', ?, ?)
        `;
        insertLogValues = [timeParamRaw, employee.ashima_id, timeParamRaw, employee.person_type];
      } else {
        insertLogQuery = `
          INSERT INTO freemeal_logs (date_claimed, ashima_id, log_type, time_claimed, meal_type)
          VALUES (CURDATE(), ?, 'CLAIMED', NOW(), ?)
        `;
        insertLogValues = [employee.ashima_id, employee.person_type];
      }

      console.log("✅ Free meal claimed for the target date.");
    } else if (latestLog.log_type === "CLAIMED" && !latestLog.flag && isSameDay) {
      nextLogType = "CLAIMED ALREADY";
      const updateQuery = `
        UPDATE freemeal_logs
        SET log_type = 'CLAIMED ALREADY', flag = 1
        WHERE id = ?
      `;
      await executeQuery({ query: updateQuery, values: [latestLog.id] });
      console.log("ℹ️ Meal already claimed earlier on this date. Status updated.");
    } else if (latestLog.log_type === "CLAIMED ALREADY" && isSameDay) {
      nextLogType = "Meal already claimed on that date. You cannot claim again.";
      console.log("❌", nextLogType);
    }

    // Insert if needed
    // if (insertLogQuery) {
    //   await executeQuery({ query: insertLogQuery, values: insertLogValues });
    // }

    // Update meal_count or last_active as before
    if (employee.person_type === 'employee' && nextLogType === 'CLAIMED' && employee.meal_count > 0) {
      const updateMealCountQuery = `
        UPDATE employees
        SET meal_count = meal_count - 1, last_active = NOW()
        WHERE ashima_id = ?
      `;
      await executeQuery({ query: updateMealCountQuery, values: [employee.ashima_id] });
    } else {
      const updateLastActiveQuery = `
        UPDATE employees
        SET last_active = NOW()
        WHERE ashima_id = ?
      `;
      await executeQuery({ query: updateLastActiveQuery, values: [employee.ashima_id] });
    }

    // Return the latest attendance entry for the (possibly manual) date
    const mergedLogsQuery = `
      SELECT id, log_type, time_claimed
      FROM freemeal_logs
      WHERE ashima_id = ?
      ORDER BY time_claimed DESC
      LIMIT 1
    `;
    const [attendanceLog] = await executeQuery({ query: mergedLogsQuery, values: [employee.ashima_id] });

    return NextResponse.json({
      employee,
      attendanceLog,
      logType: nextLogType
    });
  } catch (error) {
    console.error('Error processing free meal log:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process free meal logs.' },
      { status: 500 }
    );
  }
}