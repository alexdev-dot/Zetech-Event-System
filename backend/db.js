import mysql from "mysql2/promise";

const socketPath = process.env.DB_SOCKET || "/tmp/mysql/run/mysql.sock";
const useSocket = !process.env.DB_HOST || process.env.DB_HOST === "localhost";

export const pool = mysql.createPool({
  ...(useSocket
    ? { socketPath }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "3306") }),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlexMySQL",
  database: process.env.DB_NAME || "zetech_event_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}
