#!/usr/bin/env tsx
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const outPath = new URL("../../apps/web/src/assets/env.js", import.meta.url);
const dir = dirname(outPath.pathname);
try {
  mkdirSync(dir, { recursive: true });
} catch {}

const env = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY || "",
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
  FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "",
};

const content = `window.env = ${JSON.stringify(env, null, 2)};\n`;
writeFileSync(outPath, content);
console.log("Wrote", outPath.pathname);
