const mysql = require("mysql2/promise"); // ✅ Use mysql2/promise

async function connectDB() {
    try {
        const db = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "office_inventory",
        });

        console.log("✅ MySQL Connected!");
        return db;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1); // Exit on failure
    }
}

module.exports = connectDB;
