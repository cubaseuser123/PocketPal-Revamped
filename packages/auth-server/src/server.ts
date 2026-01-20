import "dotenv/config";
import { createServer } from "http";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";

const PORT = process.env.PORT || 3001;

// Create HTTP server with Better Auth handler
const server = createServer(toNodeHandler(auth));

server.listen(PORT, () => {
  console.log(`[Auth Server] Running on http://localhost:${PORT}`);
  console.log(`[Auth Server] API endpoints available at /api/auth/*`);
});
