import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

// Helper function to decode Base64 to binary
function decodeBase64ToBinary(base64String) {
  return Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

// GET: Fetch Trainees with Search, Filters, and Pagination
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const position = searchParams.get("position") || "";
    const status = searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    // Dynamic WHERE clause for search and filters
    const whereClause = `
      WHERE 
        (e.ashima_id LIKE ? OR e.name LIKE ?)
        ${department ? `AND d.id = ?` : ""}
        ${position ? `AND p.id = ?` : ""}
        ${status ? `AND e.status = ?` : ""}
    `;

    const query = `
      SELECT 
        e.id, e.ashima_id, e.name, 
        d.name AS department, p.name AS position, 
        e.rfid_tag, e.photo, e.emp_stat, e.status,
        e.department_id, e.position_id
      FROM 
        employees e
      LEFT JOIN 
        departments d ON e.department_id = d.id
      LEFT JOIN 
        positions p ON e.position_id = p.id
      ${whereClause}
      ORDER BY 
        e.id DESC
      LIMIT ? OFFSET ?
    `;

    const values = [
      `%${search}%`,
      `%${search}%`,
      ...(department ? [department] : []),
      ...(position ? [position] : []),
      ...(status ? [status] : []),
      limit,
      offset,
    ];

    const employees = await executeQuery({ query, values });
    const formattedEmployees = employees.map((employee) => ({
      ...employee,
      photo: employee.photo
        ? `data:image/jpeg;base64,${Buffer.from(employee.photo).toString('base64')}`
        : null,
    }));

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      ${whereClause}
    `;

    const countValues = [
      `%${search}%`,
      `%${search}%`,
      ...(department ? [department] : []),
      ...(position ? [position] : []),
      ...(status ? [status] : []),
    ];

    const totalResult = await executeQuery({ query: countQuery, values: countValues });

    return NextResponse.json({
      data: formattedEmployees,
      total: totalResult[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Failed to fetch employees:", err);
    return NextResponse.json(
      { message: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST: Add a New Trainee
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, rfid_tag, photo, trainee_stat, status, department_id, position_id } = body;

    // Decode Base64 photo to binary
    const binaryPhoto = photo ? decodeBase64ToBinary(photo) : null;

    const insertQuery = `
      INSERT INTO trainees (name, rfid_tag, photo, trainee_stat, status, department_id, position_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery({
      query: insertQuery,
      values: [
        name,
        rfid_tag || null,
        binaryPhoto,
        trainee_stat || null,
        status || null,
        department_id ? parseInt(department_id, 10) : null,
        position_id ? parseInt(position_id, 10) : null,
      ]
    });

    // Get the newly inserted ID
    const insertedId = result.insertId;

    // Fetch the complete trainee record with the new ID
    const newTrainee = await executeQuery({
      query: "SELECT * FROM trainees WHERE id = ?",
      values: [insertedId]
    });

    return NextResponse.json({
      message: "Trainee added successfully",
      trainee: newTrainee[0],
      id: insertedId
    });
  } catch (err) {
    console.error("Failed to add trainee:", err);
    return NextResponse.json(
      { message: `Failed to add trainee: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete a Trainee
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    const query = `
      DELETE FROM trainees 
      WHERE id = ?
    `;

    await executeQuery({ query, values: [id] });

    return NextResponse.json({ message: "Trainee deleted successfully" });
  } catch (err) {
    console.error("Failed to delete trainee:", err);
    return NextResponse.json(
      { message: "Failed to delete trainee" },
      { status: 500 }
    );
  }
}