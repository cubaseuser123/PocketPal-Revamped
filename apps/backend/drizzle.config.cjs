const { defineConfig } = require("drizzle-kit");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
