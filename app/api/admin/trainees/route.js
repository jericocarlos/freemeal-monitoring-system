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
        (t.ashima_id LIKE ? OR t.name LIKE ?)
        ${department ? `AND d.id = ?` : ""}
        ${position ? `AND p.id = ?` : ""}
        ${status ? `AND t.status = ?` : ""}
    `;

    const query = `
      SELECT 
        t.ashima_id, t.name,
        d.name AS department, p.name AS position,
        t.rfid_tag, t.photo,  t.status
      FROM 
        trainees t
      LEFT JOIN 
        departments d ON t.department_id = d.id
      LEFT JOIN 
        positions p ON t.position_id = p.id
      ${whereClause}
      ORDER BY 
        t.id DESC
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

    const trainees = await executeQuery({ query, values });
    const formattedTrainees = trainees.map((trainee) => ({
      ...trainee,
      photo: trainee.photo
        ? `data:image/jpeg;base64,${Buffer.from(trainee.photo).toString('base64')}`
        : null,
    }));

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM trainees t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN positions p ON t.position_id = p.id
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
      data: formattedTrainees,
      total: totalResult[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Failed to fetch trainees:", err);
    return NextResponse.json(
      { message: "Failed to fetch trainees" },
      { status: 500 }
    );
  }
}

// POST: Add a New Trainee
export async function POST(req) {
  try {
    const body = await req.json();
    const { ashima_id, name, rfid_tag, photo, trainee_stat, status, department_id, position_id } = body;

    // Decode Base64 photo to binary
    const binaryPhoto = photo ? decodeBase64ToBinary(photo) : null;

    const insertQuery = `
      INSERT INTO trainees (ashima_id, name, rfid_tag, photo, status, department_id, position_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery({
      query: insertQuery,
      values: [
        ashima_id,
        name,
        rfid_tag || null,
        binaryPhoto,
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