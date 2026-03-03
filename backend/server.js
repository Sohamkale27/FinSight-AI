const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let transactions = [];

// GET all transactions
app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

// POST new transaction
app.post("/api/transactions", (req, res) => {
  const { amount, type, category, description } = req.body;

  const newTransaction = {
    id: Date.now(),
    amount: Number(amount),
    type,
    category,
    description,
  };

  transactions.push(newTransaction);
  res.json(newTransaction);
});

app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});