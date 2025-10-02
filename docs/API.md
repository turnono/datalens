# API Documentation

This document describes the DataLens API endpoints, request/response formats, and integration examples.

## Base URL

- **Development**: `http://localhost:8787`
- **Production**: `https://your-domain.com`

## Authentication

The API supports Firebase Authentication via Bearer tokens:

```http
Authorization: Bearer <firebase-id-token>
```

If no token is provided, requests are tracked by IP address for rate limiting.

## Rate Limiting

- **Free Tier**: 100 queries per month per user/IP
- **Pro Tier**: 1000 queries per month per user
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Health Check

Check if the API is running and healthy.

```http
GET /api/health
```

**Response:**

```json
{
  "ok": true
}
```

### Query Data

Submit a natural language query to retrieve public data.

```http
POST /api/query
Content-Type: application/json
```

**Request Body:**

```json
{
  "q": "South Africa population 2000-2024",
  "mode": "analytical"
}
```

**Parameters:**

- `q` (string, required): Natural language query
- `mode` (string, optional): Query mode - `"exploratory"`, `"analytical"`, or `"generative"`

**Response:**

```json
{
  "answer": {
    "title": "Population Variables Found",
    "note": "Found 10 population-related variables for South Africa. Main variable: Total population",
    "unit": null,
    "value": 10
  },
  "chart": {
    "type": "line",
    "series": [
      {
        "label": "Total Population",
        "points": [
          { "x": "2000", "y": 45000000 },
          { "x": "2001", "y": 45500000 },
          { "x": "2002", "y": 46000000 }
        ]
      }
    ]
  },
  "sources": [
    {
      "label": "Data Commons",
      "url": "https://datacommons.org"
    }
  ],
  "raw": {
    "variables": [...],
    "dcid_name_mappings": {...},
    "status": "SUCCESS"
  },
  "_cache": true
}
```

**Response Fields:**

- `answer`: Summary answer card with title, value, unit, and note
- `chart`: Optional chart data with type and series
- `sources`: Array of source links
- `raw`: Raw response from Data Commons API
- `_cache`: Boolean indicating if response was served from cache

## Error Responses

### 400 Bad Request

```json
{
  "error": "validation_error",
  "message": "Invalid request body",
  "correlationId": "req-123"
}
```

### 429 Too Many Requests

```json
{
  "error": "rate_limited",
  "remaining": 0,
  "correlationId": "req-123"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "MCP server unavailable",
  "correlationId": "req-123"
}
```

## Data Types

### AnswerCard

```typescript
interface AnswerCard {
  title: string;
  value?: number | string;
  unit?: string | null;
  note?: string | null;
}
```

### ChartData

```typescript
interface ChartData {
  type: "line" | "bar";
  series: Series[];
}

interface Series {
  label: string;
  points: SeriesPoint[];
}

interface SeriesPoint {
  x: string | number;
  y: number | null;
}
```

### SourceLink

```typescript
interface SourceLink {
  label: string;
  url: string;
}
```

### QueryRequest

```typescript
interface QueryRequest {
  q: string;
  mode?: "exploratory" | "analytical" | "generative";
}
```

### QueryResult

```typescript
interface QueryResult {
  answer?: AnswerCard;
  chart?: ChartData;
  sources: SourceLink[];
  raw?: unknown;
}
```

## Integration Examples

### JavaScript/TypeScript

```typescript
// Basic query
const response = await fetch("/api/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${firebaseToken}`,
  },
  body: JSON.stringify({
    q: "US GDP growth rate 2020-2023",
    mode: "analytical",
  }),
});

const data = await response.json();
console.log(data.answer?.title);
```

### Python

```python
import requests

# Query with authentication
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {firebase_token}'
}

data = {
    'q': 'China population density by province',
    'mode': 'exploratory'
}

response = requests.post(
    'https://your-domain.com/api/query',
    headers=headers,
    json=data
)

result = response.json()
print(result['answer']['title'])
```

### cURL

```bash
# Basic query
curl -X POST http://localhost:8787/api/query \
  -H "Content-Type: application/json" \
  -d '{"q": "Germany unemployment rate 2023"}'

# With authentication
curl -X POST http://localhost:8787/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"q": "Japan inflation rate 2020-2024", "mode": "analytical"}'
```

## Query Examples

### Population Queries

```json
{"q": "South Africa population 2000-2024"}
{"q": "US population by state 2023"}
{"q": "World population growth rate"}
```

### Economic Queries

```json
{"q": "US GDP growth rate 2020-2023"}
{"q": "China inflation rate by month"}
{"q": "Germany unemployment rate 2023"}
```

### Geographic Queries

```json
{"q": "California population density by county"}
{"q": "Brazil deforestation rate 2010-2020"}
{"q": "India literacy rate by state"}
```

### Health Queries

```json
{"q": "US life expectancy by state 2023"}
{"q": "Global COVID-19 vaccination rates"}
{"q": "Japan healthcare spending per capita"}
```

## Caching

Responses are cached for 24 hours to improve performance. Cached responses include a `_cache: true` field.

Cache keys are based on:

- Normalized query string (lowercase, trimmed, single spaces)
- Query mode
- User ID (if authenticated)

## Rate Limiting Details

### Free Tier Limits

- **Monthly Quota**: 100 queries per user/IP
- **Burst Limit**: 10 queries per minute
- **Reset Period**: Monthly (1st of each month)

### Pro Tier Limits

- **Monthly Quota**: 1000 queries per user
- **Burst Limit**: 50 queries per minute
- **Reset Period**: Monthly

### Enterprise Limits

- **Custom Quotas**: Negotiated per contract
- **Priority Support**: Dedicated support channel
- **Custom Features**: Tailored to enterprise needs

## Webhooks (Coming Soon)

Webhook support for real-time data updates and query completion notifications.

```json
{
  "event": "query.completed",
  "data": {
    "queryId": "req-123",
    "userId": "user-456",
    "result": {
      /* QueryResult */
    }
  }
}
```

## SDKs (Coming Soon)

Official SDKs for:

- JavaScript/TypeScript
- Python
- Go
- Java

## Support

For API support:

- **Documentation**: This file and inline code comments
- **Issues**: GitHub Issues for bugs and feature requests
- **Email**: api-support@datalens.com
- **Status Page**: https://status.datalens.com

## Changelog

### v1.0.0 (Current)

- Initial API release
- Basic query functionality
- Firebase authentication
- Rate limiting
- Response caching

### Upcoming

- Webhook support
- Advanced query modes
- Bulk query endpoints
- Real-time data streaming
