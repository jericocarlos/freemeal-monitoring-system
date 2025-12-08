import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

// Helper function to decode Base64 to binary with better error handling
function decodeBase64ToBinary(base64String) {
  if (!base64String || typeof base64String !== "string") {
    console.log("Invalid or missing base64String");
    return null;
  }
  try {
    const base64Data = base64String.includes("data:image")
      ? base64String.replace(/^data:image\/\w+;base64,/, "")
      : base64String;
    return Buffer.from(base64Data, "base64");
  } catch (error) {
    console.error("Error decoding base64 string:", error);
    return null;
  }
}

// PUT: Update an Existing Intern
export async function PUT(req, context) {
  try {
    const { id } = await context.params; // 👈 Add await here
    const body = await req.json();

    const {
      ashima_id,
      name,
      department_id,
      position_id,
      rfid_tag,
      photo,
      status,
      removePhoto
    } = body;

    let binaryPhoto = null;
    if (status === "discontinued" || removePhoto) {
      binaryPhoto = null;
    } else if (photo) {
      binaryPhoto = decodeBase64ToBinary(photo);
    }

    const updateFields = [];
    const values = [];

    updateFields.push("id_number = ?");
    values.push(ashima_id);

    updateFields.push("name = ?");
    values.push(name);

    updateFields.push("department_id = ?");
    values.push(department_id);

    updateFields.push("position_id = ?");
    values.push(position_id);

    updateFields.push("rfid_tag = ?");
    values.push(status === "discontinued" || !rfid_tag ? null : rfid_tag);

    if (status === "discontinued" || removePhoto || photo) {
      updateFields.push("photo = ?");
      values.push(binaryPhoto);
    }

    updateFields.push("status = ?");
    values.push(status);

    values.push(id);

    const updateQuery = `
      UPDATE interns 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    const result = await executeQuery({ query: updateQuery, values });

    if (!result || result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No intern was updated. The intern may not exist." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Intern updated successfully",
      internId: id,
      status: status,
      photoRemoved: status === "discontinued" || removePhoto
    });
  } catch (err) {
    console.error("Failed to update intern:", err);
    return NextResponse.json(
      { message: `Failed to update intern: ${err.message}` },
      { status: 500 }
    );
  }
}

// Delete an intern
export async function DELETE(request, context) {
  try {
    const { id } = await context.params; // 👈 Add await here
    
    // Delete intern
    const deleteQuery = `DELETE FROM interns WHERE id = ?`;
    await executeQuery({ query: deleteQuery, values: [id] });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete intern:", error);
    return NextResponse.json(
      { error: "Failed to delete intern" },
      { status: 500 }
    );
  }
}