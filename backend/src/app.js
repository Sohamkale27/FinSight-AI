const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("[server] unhandled error", err);
  res.status(500).json({ error: err instanceof Error && err.message ? err.message : "Something went wrong." });
});

module.exports = app;
