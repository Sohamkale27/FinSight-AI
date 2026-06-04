const express = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma");
const { authenticateToken, signAuthToken } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function validateCredentials(body, includeName = false) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const name = includeName && typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !email.includes("@")) {
    return { error: "A valid email address is required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (includeName && !name) {
    return { error: "Name is required for signup." };
  }

  return {
    value: {
      email,
      password,
      name,
    },
  };
}

router.post("/signup", async (req, res) => {
  const parsed = validateCredentials(req.body, true);

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.value.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(parsed.value.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: parsed.value.email,
        name: parsed.value.name,
        passwordHash,
      },
    });

    const token = signAuthToken(user);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth:signup] failed", error);
    return res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/login", async (req, res) => {
  const parsed = validateCredentials(req.body, false);

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.value.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(parsed.value.password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signAuthToken(user);

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth:login] failed", error);
    return res.status(500).json({ error: "Failed to sign in." });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth:me] failed", error);
    return res.status(500).json({ error: "Failed to load session." });
  }
});

router.post("/logout", authenticateToken, async (req, res) => {
  return res.status(200).json({ message: "Logged out successfully." });
});

module.exports = router;
