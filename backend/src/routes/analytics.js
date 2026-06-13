const express = require("express");
const { prisma } = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { buildAnalyticsPayload } = require("../services/analytics");

const router = express.Router();

router.use(authenticateToken);

async function loadAnalyticsPayload(userId) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    select: {
      amount: true,
      type: true,
      category: true,
      createdAt: true,
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
  });

  return buildAnalyticsPayload(transactions);
}

router.get("/summary", async (req, res) => {
  try {
    const payload = await loadAnalyticsPayload(req.user.id);

    return res.json(payload.summary);
  } catch (error) {
    console.error("[analytics:summary] failed", error);
    return res.status(500).json({ error: "Failed to load analytics summary." });
  }
});

router.get("/charts", async (req, res) => {
  try {
    const payload = await loadAnalyticsPayload(req.user.id);

    return res.json(payload.charts);
  } catch (error) {
    console.error("[analytics:charts] failed", error);
    return res.status(500).json({ error: "Failed to load analytics charts." });
  }
});

router.get("/insights", async (req, res) => {
  try {
    const payload = await loadAnalyticsPayload(req.user.id);

    return res.json({ insights: payload.insights });
  } catch (error) {
    console.error("[analytics:insights] failed", error);
    return res.status(500).json({ error: "Failed to load analytics insights." });
  }
});

module.exports = router;
