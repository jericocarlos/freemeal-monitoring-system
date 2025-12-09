import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const query = `
     (
  SELECT 
    al.id, 
    e.rfid_tag, 
    e.name, 
    d.name AS department, 
    p.name AS position, 
    al.log_type, 
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
    i.rfid_tag, 
    i.name, 
    d.name AS department, 
    p.name AS position, 
    al.log_type, 
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
    t.rfid_tag, 
    t.name, 
    d.name AS department, 
    p.name AS position, 
    al.log_type, 
    al.time_claimed, 
    'trainee' AS person_type
  FROM freemeal_logs al
  JOIN trainees t ON al.ashima_id = t.ashima_id
  LEFT JOIN departments d ON t.department_id = d.id
  LEFT JOIN positions p ON t.position_id = p.id
)

ORDER BY time_claimed DESC
LIMIT ? OFFSET ?;
    `;

    const logs = await executeQuery({ query, values: [limit, offset] });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance logs.' },
      { status: 500 }
    );
  }
}