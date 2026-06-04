const jwt = require("jsonwebtoken");

let warnedAboutFallbackSecret = false;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET;

  if (!secret && !warnedAboutFallbackSecret) {
    warnedAboutFallbackSecret = true;
    console.warn("[auth] JWT_SECRET is not set. Using a development-only fallback secret.");
  }

  return secret || "dev-only-secret-change-me";
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication token is required." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Invalid authentication token." });
    }

    req.user = {
      id: userId,
      email: payload.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication token is invalid or expired." });
  }
}

module.exports = {
  authenticateToken,
  signAuthToken,
  getJwtSecret,
  getJwtExpiresIn,
};
