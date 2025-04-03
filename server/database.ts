import session from "express-session";
import createMemoryStore from "memorystore";
import { sql, db } from "./db";

const MemoryStore = createMemoryStore(session);

// Export from db.ts
export { sql, db };

// Create an in-memory session store
export const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // 24 hours
});

// Simple initialization to check connection
export async function initDatabase() {
  try {
    console.log("Checking database connection...");
    
    // Execute a simple query to test the connection
    const result = await sql`SELECT NOW()`;
    console.log("Database connection test successful:", result);
    
    // We'll let Drizzle handle the schema from shared/schema.ts
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}