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

      // Handle Server-Sent Events (SSE) response
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        const text = await res.text();
        // Parse SSE format: "event: message\ndata: {...}\n\n"
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonData = line.substring(6); // Remove "data: " prefix
            return JSON.parse(jsonData);
          }
        }
        throw new Error("No data found in SSE response");
      } else {
        return await res.json();
      }
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
  // Use JSON-RPC format for MCP server with tools/call method
  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "search_indicators",
      arguments: {
        query: "population",
        places: ["South Africa"],
        include_topics: false,
      },
    },
    id: Math.random().toString(36).substring(7),
  };

  const raw = await fetchWithRetries(
    base.replace(/\/$/, "") + "/mcp",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
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
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(payload),
      },
      10_000,
      0
    );
  });

  // Parse MCP server response format
  let mcpData: any = null;
  if (raw?.result?.content?.[0]?.text) {
    try {
      mcpData = JSON.parse(raw.result.content[0].text);
    } catch (e) {
      // If parsing fails, use the raw text
      mcpData = { text: raw.result.content[0].text };
    }
  }

  // If server returns our normalized shape already
  const parsed = QueryResultSchema.safeParse(mcpData || raw);
  if (parsed.success) return parsed.data;

  // Handle MCP search_indicators response
  if (mcpData?.variables && Array.isArray(mcpData.variables)) {
    const variables = mcpData.variables;
    const dcidMappings = mcpData.dcid_name_mappings || {};

    // Find the main population variable
    const mainVar =
      variables.find((v: any) => v.dcid === "Count_Person") || variables[0];
    const varName = dcidMappings[mainVar.dcid] || mainVar.dcid;

    return {
      answer: {
        title: "Population Variables Found",
        note: `Found ${variables.length} population-related variables for South Africa. Main variable: ${varName}`,
        unit: null,
        value: variables.length,
      },
      chart: undefined,
      sources: [{ label: "Data Commons", url: "https://datacommons.org" }],
      raw: mcpData,
    };
  }

  // Heuristic mapping: attempt to build a friendly result
  const answerText: string | undefined =
    mcpData?.answer?.text ||
    mcpData?.text ||
    mcpData?.summary ||
    raw?.answer?.text ||
    raw?.text ||
    raw?.summary;
  const unit = mcpData?.unit ?? raw?.unit ?? null;
  const value =
    typeof mcpData?.value === "number" || typeof mcpData?.value === "string"
      ? mcpData.value
      : typeof raw?.value === "number" || typeof raw?.value === "string"
      ? raw.value
      : undefined;

  const sources: Array<{ label: string; url: string }> = [];
  const citations =
    mcpData?.citations ||
    mcpData?.sources ||
    raw?.citations ||
    raw?.sources ||
    [];
  if (Array.isArray(citations)) {
    for (const c of citations) {
      const label = c?.label || c?.name || c?.url || "source";
      const url = c?.url || c?.href || "";
      if (url) sources.push({ label, url });
    }
  }

  // Attempt to map timeseries if present
  let chart: QueryResult["chart"] | undefined;
  const series =
    mcpData?.series ||
    mcpData?.timeSeries ||
    mcpData?.timeseries ||
    raw?.series ||
    raw?.timeSeries ||
    raw?.timeseries;
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
    raw: mcpData || raw,
  };
  return result;
}
