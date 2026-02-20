import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { db } from "./config/db.js";
import { users } from "./drizzle/schema.js";

async function check() {
  await db.delete(users);
  console.log("Deleted all users");
  process.exit(0);
}
check();
