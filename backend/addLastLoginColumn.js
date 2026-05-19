import "dotenv/config";
import { pool } from "./db.js";

async function addLastLoginColumn() {
  try {
    console.log("Adding last_login column to student_registrations table...");
    
    await pool.execute(`
      ALTER TABLE student_registrations 
      ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL
    `);
    
    console.log("Successfully added last_login column");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column last_login already exists");
    } else {
      console.error("Error adding column:", error);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

addLastLoginColumn();
