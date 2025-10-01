import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  QueryRequestSchema,
  normalizeQueryString,
  type QueryRequest,
} from "@datalens/shared";
import { queryMcp } from "./mcpAdapter.js";
import {
  getCacheKey,
  getCached,
  setCached,
  getInFlight,
  setInFlight,
} from "./cache.js";
import { enforceMonthlyRateLimit } from "./rateLimit.js";
import { getAuth } from "firebase-admin/auth";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => {
    const allowed = process.env.WEB_ORIGIN || "http://localhost:4200";
    if (!origin || origin === allowed) cb(null, true);
    else cb(new Error("CORS not allowed"), false);
  },
  methods: ["GET", "POST"],
  credentials: false,
});

app.get("/api/health", async () => ({ ok: true }));

app.post("/api/query", async (req, reply) => {
  const correlationId = randomUUID();
  try {
    const body = (req.body ?? {}) as unknown;
    const parse = QueryRequestSchema.safeParse(body);
    if (!parse.success) {
      reply.code(400);
      return {
        error: "invalid_body",
        details: parse.error.flatten(),
        correlationId,
      };
    }
    const { q, mode } = parse.data as QueryRequest;

    // Identify user: Firebase ID token (Authorization: Bearer <token>) or IP bucket
    let userId: string | null = null;
    const authz = (req.headers["authorization"] as string | undefined) || "";
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (m) {
      try {
        const token = m[1];
        const decoded = await getAuth().verifyIdToken(token);
        userId = decoded.uid;
      } catch {
        userId = null;
      }
    }
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() || (req.ip as string);
    const bucket = userId ? `user:${userId}` : `ip:${ip}`;

    const rl = await enforceMonthlyRateLimit(bucket);
    if (!rl.allowed) {
      reply.code(429);
      return { error: "rate_limited", remaining: rl.remaining, correlationId };
    }

    const normalized = normalizeQueryString(q);
    const cacheKey = getCacheKey(normalized, mode);
    const cached = getCached(cacheKey);
    if (cached) return { ...cached, _cache: true };

    const inflight = getInFlight(cacheKey);
    const promise = inflight ?? queryMcp(normalized, mode);
    if (!inflight) setInFlight(cacheKey, promise);

    const result = await promise;
    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    req.log.error({ err }, "query failed");
    reply.code(500);
    return {
      error: "internal_error",
      message: err?.message ?? "unknown",
      correlationId,
    };
  }
});

const port = Number(process.env.PROXY_PORT || 8787);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => console.log(`mcp-proxy listening on http://localhost:${port}`))
  .catch((e) => {
    console.error("Failed to start server", e);
    process.exit(1);
  });
