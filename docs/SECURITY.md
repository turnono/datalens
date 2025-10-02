### Security principles

- MCP server reachable only from backend proxy
- API keys in environment or secret manager, never exposed to clients
- Structured JSON errors with correlation IDs
- Logging policy: no PII; redact query text unless user opts-in to save history
