## DataLens

Public-data explorer powered by an MCP server proxy.

### Local setup

1. Install MCP server:
   - `pip install datacommons-mcp`
   - `export DATACOMMONS_API_KEY=...`
   - `datacommons-mcp --api_key $DATACOMMONS_API_KEY --transport http --host 0.0.0.0 --port 8077`
2. Copy env: `cp .env.example .env` and fill values
3. Install and run:
   - `pnpm i`
   - `pnpm dev`

Apps:

- web: `http://localhost:4200`
- mcp-proxy: `http://localhost:8787`

Try queries:

- “South Africa population 2000–2024”
- “Compare life expectancy in BRICS”
- “What health data exists for Africa?”

### Notes

- MCP is only accessed by the backend proxy.
- Free tier: 10 queries per month (IP bucket if anonymous). Firestore stores usage counters.
