import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

console.log( process.env.DATABASE_URL)

console.log("Drizzle initializing with URL:", process.env.DATABASE_URL);

export const db = drizzle({ 
  connection: { 
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? true : false
  }
});
