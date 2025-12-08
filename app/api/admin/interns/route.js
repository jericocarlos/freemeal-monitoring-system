import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

// Helper function to decode Base64 to binary
function decodeBase64ToBinary(base64String) {
  return Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

// GET: Fetch Interns with Search, Filters, and Pagination
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

    // Dynamic WHERE clause for search and filters (exclude discontinued)
    const whereParts = [
      "(i.id_number LIKE ? OR i.name LIKE ?)"
    ];

    if (department) whereParts.push("d.id = ?");
    if (position) whereParts.push("p.id = ?");

    // Always exclude discontinued interns
    whereParts.push("i.status != 'discontinued'");

    // If a status filter is provided and it's not 'discontinued', include it
    const includeStatusFilter = status && status !== "discontinued";
    if (includeStatusFilter) whereParts.push("i.status = ?");

    const whereClause = `WHERE ${whereParts.join(" AND ")}`;

    const query = `
      SELECT 
        i.id, i.id_number as ashima_id, i.name, 
        d.name AS department, p.name AS position, 
        i.rfid_tag, i.photo, i.status,
        i.department_id, i.position_id
      FROM 
        interns i
      LEFT JOIN 
        departments d ON i.department_id = d.id
      LEFT JOIN 
        positions p ON i.position_id = p.id
      ${whereClause}
      ORDER BY 
        i.id DESC
      LIMIT ? OFFSET ?
    `;

    const values = [
      `%${search}%`,
      `%${search}%`,
      ...(department ? [department] : []),
      ...(position ? [position] : []),
      ...(includeStatusFilter ? [status] : []),
      limit,
      offset,
    ];

    const interns = await executeQuery({ query, values });
    const formattedInterns = interns.map((intern) => ({
      ...intern,
      photo: intern.photo
        ? `data:image/jpeg;base64,${Buffer.from(intern.photo).toString('base64')}`
        : null,
    }));

    // Count query uses same whereClause and similar values (without limit/offset)
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM interns i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN positions p ON i.position_id = p.id
      ${whereClause}
    `;

    const countValues = [
      `%${search}%`,
      `%${search}%`,
      ...(department ? [department] : []),
      ...(position ? [position] : []),
      ...(includeStatusFilter ? [status] : []),
    ];

    const totalResult = await executeQuery({ query: countQuery, values: countValues });

    return NextResponse.json({
      data: formattedInterns,
      total: totalResult[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Failed to fetch interns:", err);
    return NextResponse.json(
      { message: "Failed to fetch interns" },
      { status: 500 }
    );
  }
}
// POST: Add a New Intern
export async function POST(req) {
  try {
    const body = await req.json();
    const { ashima_id, name, rfid_tag, photo, department_id, position_id } = body;

    // Decode Base64 photo to binary
    const binaryPhoto = photo ? decodeBase64ToBinary(photo) : null;

    const insertQuery = `
      INSERT INTO interns (id_number, name, rfid_tag, photo, status, department_id, position_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery({
      query: insertQuery,
      values: [
        ashima_id,
        name,
        rfid_tag || null,
        binaryPhoto,
        "active",
        department_id ? parseInt(department_id, 10) : null,
        position_id ? parseInt(position_id, 10) : null
      ]
    });

    // Get the newly inserted ID
    const insertedId = result.insertId;

    // Fetch the complete intern record with the new ID
    const newIntern = await executeQuery({
      query: "SELECT * FROM interns WHERE id = ?",
      values: [insertedId]
    });

    return NextResponse.json({
      message: "Intern added successfully",
      intern: newIntern[0],
      id: insertedId
    });
  } catch (err) {
    console.error("Failed to add intern:", err);
    return NextResponse.json(
      { message: `Failed to add intern: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete an Intern
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Intern ID is required" },
        { status: 400 }
      );
    }

    const query = `
      DELETE FROM interns 
      WHERE id = ?
    `;

    await executeQuery({ query, values: [id] });

    return NextResponse.json({ message: "Intern deleted successfully" });
  } catch (err) {
    console.error("Failed to delete intern:", err);
    return NextResponse.json(
      { message: "Failed to delete intern" },
      { status: 500 }
    );
  }
}