import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request) {
  try {
    const { rfid_tag } = await request.json();

    if (!rfid_tag) {
      return NextResponse.json(
        { error: 'RFID tag is required.' },
        { status: 400 }
      );
    }

    // Fetch employee info
    const employeeQuery = `
      SELECT 
        e.id AS employee_id, 
        e.ashima_id, 
        e.name, 
        d.name AS department, 
        p.name AS position, 
        e.photo, 
        e.status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.rfid_tag = ?
    `;
    const [employee] = await executeQuery({ query: employeeQuery, values: [rfid_tag] });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found for the provided RFID tag.' },
        { status: 404 }
      );
    }

    if (employee.photo) {
      employee.photo = `data:image/png;base64,${Buffer.from(employee.photo).toString('base64')}`;
    }

    // Step 1: Get latest free meal log for today
    const latestLogQuery = `
      SELECT * FROM freemeal_logs
      WHERE ashima_id = ?
      AND DATE(time_claimed) = CURDATE()
      ORDER BY time_claimed DESC
      LIMIT 1
    `;

    const [latestLog] = await executeQuery({
      query: latestLogQuery,
      values: [employee.ashima_id],
    });

    let nextLogType = "CLAIMED";
    let insertLogQuery = "";
    let insertLogValues = [];

    const today = new Date();
    const claimedDate = new Date(latestLog?.time_claimed);

    const isSameDay = latestLog &&
      claimedDate.getDate() === today.getDate() &&
      claimedDate.getMonth() === today.getMonth() &&
      claimedDate.getFullYear() === today.getFullYear();

    if (!latestLog || !isSameDay) {
      // No log today → allow claim for today
      nextLogType = "CLAIMED";
      insertLogQuery = `
        INSERT INTO freemeal_logs (date_claimed, ashima_id, log_type, time_claimed)
        VALUES (CURDATE(), ?, 'CLAIMED', NOW())
      `;
      insertLogValues = [employee.ashima_id];

      console.log("✅ Free meal claimed for today.");

    } else if (latestLog.log_type === "CLAIMED" && !latestLog.flag && isSameDay) {
      // If today's CLAIMED exists but not completed → update to "CLAIMED ALREADY"
      nextLogType = "CLAIMED ALREADY";
      const updateQuery = `
        UPDATE freemeal_logs
        SET log_type = 'CLAIMED ALREADY', flag = 1
        WHERE id = ?
      `;
      await executeQuery({ query: updateQuery, values: [latestLog.id] });

      console.log("ℹ️ Meal already claimed earlier today. Status updated.");

    } else if (latestLog.log_type === "CLAIMED ALREADY" && isSameDay) {
      // Already claimed and completed today → block
      nextLogType = "Meal already claimed today. You cannot claim again.";
      console.log("❌", nextLogType);
    }

    // Only do insert if this is a new CLAIMED
    if (insertLogQuery) {
      await executeQuery({ query: insertLogQuery, values: insertLogValues });
    }

    // Update status/last_active as before
    // if (employee.status === 'inactive') {
    //   const updateStatusQuery = `
    //     UPDATE employees
    //     SET status = 'active', last_active = NOW()
    //     WHERE ashima_id = ?
    //   `;
    //   await executeQuery({ query: updateStatusQuery, values: [employee.ashima_id] });
    // } else {
    //   const updateLastActiveQuery = `
    //     UPDATE employees
    //     SET last_active = NOW()
    //     WHERE ashima_id = ?
    //   `;
    //   await executeQuery({ query: updateLastActiveQuery, values: [employee.ashima_id] });
    // }

    // Return the latest attendance entry for this user
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