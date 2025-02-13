// Backend: Express.js with MySQL
const express = require("express");
// const mysql = require("mysql2/promise");
const cors = require("cors");
const connectDB = require("./db");

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;

async function startServer() {
  const db = await connectDB();
  app.get("/users", async (req, res) => {
    try {
      const users = await db.query("SELECT * FROM users");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/users", async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name is required" });
    }

    const result = await db.query(
      "INSERT INTO users (name,email) VALUES (?,?)",
      [name, email]
    );
    res.json({ id: result.insertId, name });
  });

  app.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and Email are required" });
    }

    try {
      const result = await db.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, id]
      );

      if (result[0].affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/stock", async (req, res) => {
    try {
      const [stock] = await db.query("SELECT * FROM inventory"); // ✅ Destructure result
      res.json(stock);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Routes
  app.get("/items", async (req, res) => {
    try {
      const [items] = await db.query("SELECT * FROM inventory");
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/items", (req, res) => {
    const { name, quantity, reorder_level } = req.body;
    db.query(
      "INSERT INTO inventory (name, quantity, reorder_level) VALUES (?, ?, ?)",
      [name, quantity, reorder_level],
      (err, result) => {
        if (err) throw err;
        res.json({ message: "Item added", id: result.insertId });
      }
    );
  });

  app.put("/items/:id", (req, res) => {
    const { quantity } = req.body;
    db.query(
      "UPDATE inventory SET quantity = ? WHERE id = ?",
      [quantity, req.params.id],
      (err, result) => {
        if (err) throw err;
        res.json({ message: "Item updated" });
      }
    );
  });

  app.delete("/items/:id", (req, res) => {
    db.query(
      "DELETE FROM inventory WHERE id = ?",
      [req.params.id],
      (err, result) => {
        if (err) throw err;
        res.json({ message: "Item deleted" });
      }
    );
  });

  app.get("/transactions", async (req, res) => {
    try {
      const [transactions] = await db.query(`
            SELECT t.id, u.name AS user_name, i.name AS inventory_name, t.quantity_given, t.date_given
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN inventory i ON t.inventory_id = i.id
        `);
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/give-stock", async (req, res) => {
    const { userId, inventoryId, quantityGiven } = req.body;

    try {
      // Check if stock is available
      const inventory = await db.query(
        "SELECT quantity FROM inventory WHERE id = ?",
        [inventoryId]
      );

      if (inventory[0].quantity < quantityGiven) {
        return res
          .status(400)
          .json({ message: "Not enough Inventory available" });
      }

      // Deduct stock and log transaction
      await db.query(
        "INSERT INTO transactions (user_id, inventory_id, quantity_given) VALUES (?, ?, ?)",
        [userId, inventoryId, quantityGiven]
      );

      await db.query(
        "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
        [quantityGiven, inventoryId]
      );

      res.json({ message: "Inventory given successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/inventory-transactions", async (req, res) => {
    try {
      const [transactions] = await db.query(`
        SELECT it.id, i.name AS inventory_name, it.transaction_type, it.quantity, it.created_at
        FROM inventory_transactions it
        JOIN inventory i ON it.inventory_id = i.id
        ORDER BY it.created_at DESC
      `);
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/inventory/:id/refill", async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    try {
      await db.query(
        "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
        [quantity, id]
      );

      // Insert into inventory_transactions table
      await db.query(
        "INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity) VALUES (?, 'refill', ?)",
        [id, quantity]
      );

      res.json({ message: "Inventory refilled successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/inventory/:id/deduct", async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    try {
      // Ensure we don't go negative
      const [item] = await db.query(
        "SELECT quantity FROM inventory WHERE id = ?",
        [id]
      );
      if (item[0].quantity < quantity) {
        return res.status(400).json({ error: "Not enough stock available" });
      }

      await db.query(
        "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
        [quantity, id]
      );

      // Insert into inventory_transactions table
      await db.query(
        "INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity) VALUES (?, 'deduct', ?)",
        [id, quantity]
      );

      res.json({ message: "Inventory deducted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.log("Server running on port 5000");
  });
}

startServer();
