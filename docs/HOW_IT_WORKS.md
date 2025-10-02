### Modes

- exploratory: discover what data exists
- analytical: comparisons and time series
- generative: short textual summary with citations

### MCP → QueryResult mapping

- If the MCP response already matches `QueryResult`, return it.
- Else, build `answer.note` from `text/summary`, map `series` to ChartData, and collect `citations` as sources.

### Caching & rate limits

- 24h in-memory cache keyed by normalized query string + mode. TODO: use Firestore/Redis in production.
- Free tier: 10 queries/month per user or IP bucket.
