import jwt from "jsonwebtoken";
// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

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
      console.log("❌ protect middleware: No token received. Headers:", req.headers);
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from PostgreSQL
    // const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
        // Select logic? Drizzle query builder selects all by default unless columns specified.
        // Prisma `select` handles field masking.
        // If we want to mask, we can use `columns: { ... }` in Drizzle.
        // However, middleware often just needs full user or at least ID/Role.
        // Let's replicate the selection from original file if possible, or just select all for simplicity.
        // Original selected almost everything except maybe password (which doesn't exist on User model anyway?)
        // Let's just fetch all fields. The user object is attached to req.user.
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // attach full user object
    next(); // VERY IMPORTANT
  } catch (error) {
    console.error("❌ protect middleware error:", error.message);
    return res.status(401).json({
      message: "Not authorized",
      error: error.message,
    });
  }
};
