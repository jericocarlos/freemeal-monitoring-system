import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Execute SQL queries
export async function executeQuery({ query, values = [] }) {
  try {
    const [results] = await pool.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// --- Authentication/User Functions ---

// Get a user by either username or employee ID
export async function getUserByIdentifier(identifier) {
  try {
    const users = await executeQuery({
      query: 'SELECT * FROM admin_users WHERE username = ? OR employee_id = ?',
      values: [identifier, identifier],
    });
    return users.length ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Get a user by ID
export async function getUserById(id) {
  try {
    const users = await executeQuery({
      query: 'SELECT id, name, username, employee_id FROM admin_users WHERE id = ?',
      values: [id],
    });
    return users.length ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// --- Free Meal Functions ---

export async function findEmployeeByRfid(rfidTag) {
  const query = 'SELECT * FROM employees WHERE rfid_tag = ?';
  const results = await executeQuery({ query, values: [rfidTag] });
  return results[0] || null;
}

export async function getLastFreeMealLog(employeeId) {
  const query = 'SELECT * FROM freemeal_logs WHERE ashima_id = ? ORDER BY timestamp DESC LIMIT 1';
  const results = await executeQuery({ query, values: [employeeId] });
  return results[0] || null;
}

export async function createFreeMealLog(employeeId, logType) {
  const query = 'INSERT INTO freemeal_logs (ashima_id, log_type) VALUES (?, ?)';
  return await executeQuery({ query, values: [employeeId, logType] });
}

export async function getFreeMealLogs(limit = 20) {
  const query = `
    SELECT al.id, al.log_type, al.timestamp, e.name, e.ashima_id as emp_id, e.department
    FROM freemeal_logs al
    JOIN employees e ON al.ashima_id = e.id
    ORDER BY al.timestamp DESC
    LIMIT ?
  `;
  return await executeQuery({ query, values: [limit] });
}