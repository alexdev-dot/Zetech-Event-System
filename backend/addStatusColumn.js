import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'AlexMySQL',
  database: 'zetech_event_system'
});

try {
  await connection.query('ALTER TABLE student_registrations ADD COLUMN status ENUM("active", "deleted") DEFAULT "active"');
  console.log('Status column added successfully');
} catch (error) {
  console.log('Error:', error.message);
}

await connection.end();
