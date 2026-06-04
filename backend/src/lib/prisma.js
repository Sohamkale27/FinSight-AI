const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return databaseUrl;
  }

  try {
    const parsedUrl = new URL(databaseUrl);

    if (!parsedUrl.searchParams.has("sslmode")) {
      parsedUrl.searchParams.set("sslmode", "require");
    }

    if (!parsedUrl.searchParams.has("uselibpqcompat")) {
      parsedUrl.searchParams.set("uselibpqcompat", "true");
    }

    if (!parsedUrl.searchParams.has("channel_binding")) {
      parsedUrl.searchParams.set("channel_binding", "disable");
    }

    if (!parsedUrl.searchParams.has("pgbouncer")) {
      parsedUrl.searchParams.set("pgbouncer", "true");
    }

    if (!parsedUrl.searchParams.has("connect_timeout")) {
      parsedUrl.searchParams.set("connect_timeout", "15");
    }

    return parsedUrl.toString();
  } catch (error) {
    console.warn("[prisma] unable to normalize DATABASE_URL", error);
    return databaseUrl;
  }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (error) => {
  console.error("[pg] pool error", error);
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

module.exports = {
  prisma,
  pool,
  databaseUrl,
  normalizeDatabaseUrl,
};
