#!/usr/bin/env tsx
import "dotenv/config";

const url = process.env.MCP_SERVER_URL || "http://localhost:8077";

async function main() {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    await fetch(url, { signal: controller.signal }).catch(() => {});
    clearTimeout(t);
  } catch {}
  console.log("\n👉 If MCP is not running, start it:");
  console.log("   pip install datacommons-mcp");
  console.log("   export DATACOMMONS_API_KEY=...");
  console.log(
    "   datacommons-mcp --api_key $DATACOMMONS_API_KEY --transport http --host 0.0.0.0 --port 8077\n"
  );
}

main();
