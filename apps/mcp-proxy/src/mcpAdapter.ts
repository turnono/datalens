import {
  QueryResultSchema,
  type QueryResult,
  type QueryRequest,
} from "@datalens/shared";

function timeoutFetch(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

async function fetchWithRetries(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  retries: number
) {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await timeoutFetch(url, init, timeoutMs);
      if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function queryMcp(
  q: string,
  mode: QueryRequest["mode"]
): Promise<QueryResult> {
  const base = process.env.MCP_SERVER_URL || "http://localhost:8077";
  // Minimal HTTP transport: send NL query and mode; server-specific contract may vary.
  const payload = { query: q, mode };

  const raw = await fetchWithRetries(
    base.replace(/\/$/, "") + "/query",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
    10_000,
    2
  ).catch(async () => {
    // Fallback: try root endpoint for servers that accept POST /
    return await fetchWithRetries(
      base,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
      10_000,
      0
    );
  });

  // If server returns our normalized shape already
  const parsed = QueryResultSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Heuristic mapping: attempt to build a friendly result
  const answerText: string | undefined =
    raw?.answer?.text || raw?.text || raw?.summary;
  const unit = raw?.unit ?? null;
  const value =
    typeof raw?.value === "number" || typeof raw?.value === "string"
      ? raw.value
      : undefined;

  const sources: Array<{ label: string; url: string }> = [];
  const citations = raw?.citations || raw?.sources || [];
  if (Array.isArray(citations)) {
    for (const c of citations) {
      const label = c?.label || c?.name || c?.url || "source";
      const url = c?.url || c?.href || "";
      if (url) sources.push({ label, url });
    }
  }

  // Attempt to map timeseries if present
  let chart: QueryResult["chart"] | undefined;
  const series = raw?.series || raw?.timeSeries || raw?.timeseries;
  if (Array.isArray(series)) {
    chart = {
      type: "line",
      series: series.slice(0, 5).map((s: any, idx: number) => ({
        label: String(s?.label ?? s?.name ?? `Series ${idx + 1}`),
        points: Array.isArray(s?.points)
          ? s.points.map((p: any) => ({
              x: p?.x ?? p?.t ?? p?.year ?? "",
              y: p?.y ?? p?.value ?? null,
            }))
          : [],
      })),
    };
  }

  const result: QueryResult = {
    answer: answerText
      ? { title: "Answer", note: answerText, unit, value }
      : undefined,
    chart,
    sources,
    raw,
  };
  return result;
}
