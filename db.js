const mysql = require("mysql2/promise"); // ✅ Use mysql2/promise
const fs = require("fs");
const path = require("path");

const caPath = path.join(process.cwd(), "certs", "ca.pem");

async function connectDB() {
  try {
    console.log({
      host: "mysql-inventory-dhruv-f140.h.aivencloud.com",
      port: 20050,
      user: "avnadmin",
      password: process.env.PASSWORD,
      database: "defaultdb",
      ssl: {
        ca: fs.readFileSync(caPath), // Provide the correct path to CA.pem
      },
    });
    const db = await mysql.createConnection({
      host: "mysql-inventory-dhruv-f140.h.aivencloud.com",
      port: 20050,
      user: "avnadmin",
      password: process.env.PASSWORD,
      database: "defaultdb",
      ssl: {
        ca: fs.readFileSync(caPath), // Provide the correct path to CA.pem
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
