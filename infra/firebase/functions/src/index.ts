import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  QueryRequestSchema,
  normalizeQueryString,
  type QueryRequest,
} from "./shared.js";

// Initialize Firebase Admin (automatic with Functions)
initializeApp();

// Import MCP adapter and utilities
import { queryMcp } from "./mcpAdapter.js";
import {
  getCacheKey,
  getCached,
  setCached,
  getInFlight,
  setInFlight,
} from "./cache.js";
import { enforceMonthlyRateLimit } from "./rateLimit.js";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Health check endpoint
export const health = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    res.set(corsHeaders);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    res.json({ ok: true });
  }
);

// Main API endpoint
export const api = onRequest(
  {
    region: "us-central1",
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    res.set(corsHeaders);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const correlationId = randomUUID();

    try {
      const body = req.body as unknown;
      const parse = QueryRequestSchema.safeParse(body);

      if (!parse.success) {
        res.status(400).json({
          error: "invalid_body",
          details: parse.error.flatten(),
          correlationId,
        });
        return;
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
        (req.headers["x-forwarded-for"] as string) ||
        (req.headers["x-real-ip"] as string) ||
        "unknown";
      const bucket = userId ? `user:${userId}` : `ip:${ip}`;

      // Rate limiting
      const rl = await enforceMonthlyRateLimit(bucket);
      if (!rl.allowed) {
        res.status(429).json({
          error: "rate_limited",
          remaining: rl.remaining,
          correlationId,
        });
        return;
      }

      // Check cache
      const normalized = normalizeQueryString(q);
      const cacheKey = getCacheKey(normalized, mode);
      const cached = getCached(cacheKey);

      if (cached) {
        res.json({ ...cached, _cache: true });
        return;
      }

      // Single-flight deduplication
      const inflight = getInFlight(cacheKey);
      const promise = inflight ?? queryMcp(normalized, mode);
      if (!inflight) setInFlight(cacheKey, promise);

      const result = await promise;
      setCached(cacheKey, result);

      res.json(result);
    } catch (err: any) {
      console.error("Query failed:", err);
      res.status(500).json({
        error: "internal_error",
        message: err?.message ?? "unknown",
        correlationId,
      });
    }
  }
);
