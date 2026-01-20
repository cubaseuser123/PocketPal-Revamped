import jwt from "jsonwebtoken";
import { LRUCache } from "lru-cache";
import { db } from "../config/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const tokenCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      if (process.env.DEBUG === 'true') {
        console.log(
          "❌ protect middleware: No token received. Headers:",
          req.headers,
        );
      }
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const secret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
    let userId;

    // Check if it looks like a JWT (3 parts separated by dots)
    const isJwt = token.split('.').length === 3;

    if (isJwt) {
      try {
        if (process.env.DEBUG === 'true') console.log("🔐 Verifying JWT with secret ending in:", secret?.slice(-4));
        const decoded = jwt.verify(token, secret);
        userId = decoded.sub || decoded.id;
      } catch (jwtError) {
        if (process.env.DEBUG === 'true') console.log("⚠️ JWT verification failed, trying auth server:", jwtError.message);
      }
    }

    // If not a JWT or JWT verification failed, try auth server
    if (!userId) {
      // 1. Check Cache
      if (tokenCache.has(token)) {
        if (process.env.DEBUG === 'true') console.log("⚡ Serving session from cache");
        userId = tokenCache.get(token);
      } else {
        if (process.env.DEBUG === 'true') console.log("🔍 Verifying session with Auth Server...");
        try {
          const authResponse = await fetch(`${process.env.AUTH_SERVER_URL}/get-session`, {
            method: "GET",
            headers: {
              "Authorization": req.headers.authorization,
              "Origin": req.headers.origin || "app://pocketpal" // Ensure correct origin
            }
          });

          if (authResponse.ok) {
             const sessionData = await authResponse.json();
             
             if (sessionData?.session) {
               if (process.env.DEBUG === 'true') console.log("✅ Auth Server verified session for user:", sessionData.user.id);
               userId = sessionData.user.id;
               // 2. Set Cache
               tokenCache.set(token, userId);
             } else {
               if (process.env.DEBUG === 'true') console.log("⚠️ Auth Server returned 200 but no session data.");
             }
          } else {
               if (process.env.DEBUG === 'true') console.log("❌ Auth Server rejected session:", authResponse.status, authResponse.statusText);
          }
        } catch (authError) {
          console.error("❌ Failed to contact Auth Server:", authError.message);
        }
      }
    }

    if (!userId) {
       if (process.env.DEBUG === 'true') console.log("❌ No valid JWT or Session found");
       return res.status(401).json({ message: "Not authorized, invalid token" });
    }

    // Fetch user from PostgreSQL
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ protect middleware error:", error.message);
    return res.status(401).json({
      message: "Not authorized",
      error: error.message,
    });
  }
};
