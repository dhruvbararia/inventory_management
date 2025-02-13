const mysql = require("mysql2/promise"); // ✅ Use mysql2/promise
const fs = require("fs");

async function connectDB() {
  try {
    const db = await mysql.createConnection({
      host: "mysql-inventory-dhruv-f140.h.aivencloud.com",
      port: 20050,
      user: "avnadmin",
      password: process.env.password,
      database: "defaultdb",
      ssl: {
        ca: process.env.ca, // Provide the correct path to CA.pem
      },
    });

    console.log("✅ MySQL Connected!");
    return db;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit on failure
  }
}

module.exports = connectDB;
