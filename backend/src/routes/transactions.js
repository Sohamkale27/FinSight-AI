const express = require("express");
const { prisma } = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function validateTransactionPayload(body) {
  const amount = Number(body.amount);
  const type = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a number greater than 0." };
  }

  if (!['income', 'expense'].includes(type)) {
    return { error: "Type must be either income or expense." };
  }

  if (!category) {
    return { error: "Category is required." };
  }

  if (!description) {
    return { error: "Description is required." };
  }

  return {
    value: {
      amount,
      type,
      category,
      description,
    },
  };
}

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    console.log(`[transactions:get] user=${req.user.id} returned ${transactions.length} record(s)`);
    return res.json(transactions);
  } catch (error) {
    console.error("[transactions:get] failed", error);
    return res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

router.post("/", async (req, res) => {
  const parsedPayload = validateTransactionPayload(req.body);

  if (parsedPayload.error) {
    return res.status(400).json({ error: parsedPayload.error });
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...parsedPayload.value,
        userId: req.user.id,
      },
    });

    console.log("[transactions:post] inserted", transaction);
    return res.status(201).json(transaction);
  } catch (error) {
    console.error("[transactions:post] failed", error);
    return res.status(500).json({ error: "Failed to save transaction." });
  }
});

router.delete("/:id", async (req, res) => {
  const transactionId = Number(req.params.id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({ error: "Transaction id must be a positive integer." });
  }

  try {
    const deleteResult = await prisma.transaction.deleteMany({
      where: {
        id: transactionId,
        userId: req.user.id,
      },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    console.log(`[transactions:delete] removed id=${transactionId} user=${req.user.id}`);
    return res.status(204).send();
  } catch (error) {
    console.error(`[transactions:delete] failed for id=${transactionId}`, error);
    return res.status(500).json({ error: "Failed to delete transaction." });
  }
});

module.exports = router;
