const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const { prisma, pool } = require("./lib/prisma");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("[pg] connected successfully");

    await prisma.$connect();
    console.log("[prisma] connected successfully");

    app.listen(PORT, () => {
      console.log(`[server] running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[server] failed to start", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[server] shutting down after ${signal}`);
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("[server] shutdown failed", error);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("[server] shutdown failed", error);
    process.exit(1);
  });
});

startServer();
