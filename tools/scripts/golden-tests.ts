#!/usr/bin/env tsx
import { strict as assert } from "node:assert";
import "dotenv/config";

const base = process.env.PROXY_ORIGIN || "http://localhost:8787";

async function call(q: string, mode?: string) {
  const res = await fetch(base + "/api/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ q, mode }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.json();
}

async function test_sa_population_timeseries() {
  const r = await call("South Africa population 2000–2024", "analytical");
  assert.ok(r.chart?.type === "line");
}

async function test_brics_life_expectancy_compare() {
  const r = await call("Compare life expectancy in BRICS", "analytical");
  assert.ok(Array.isArray(r.chart?.series));
}

async function test_explore_africa_health() {
  const r = await call("What health data exists for Africa?", "exploratory");
  assert.ok(Array.isArray(r.sources));
}

await test_sa_population_timeseries();
await test_brics_life_expectancy_compare();
await test_explore_africa_health();
console.log("golden tests passed");
