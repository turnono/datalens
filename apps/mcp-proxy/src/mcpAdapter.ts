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

  // Extract country and topic from query
  const queryLower = q.toLowerCase();
  let country = "South Africa"; // default
  let countryDcid = "country/ZAF"; // default
  let topic = "population"; // default

  // Simple country detection with DCID mapping
  if (queryLower.includes("germany")) {
    country = "Germany";
    countryDcid = "country/DEU";
  } else if (
    queryLower.includes("usa") ||
    queryLower.includes("united states")
  ) {
    country = "United States";
    countryDcid = "country/USA";
  } else if (queryLower.includes("china")) {
    country = "China";
    countryDcid = "country/CHN";
  } else if (queryLower.includes("japan")) {
    country = "Japan";
    countryDcid = "country/JPN";
  } else if (queryLower.includes("brazil")) {
    country = "Brazil";
    countryDcid = "country/BRA";
  } else if (queryLower.includes("india")) {
    country = "India";
    countryDcid = "country/IND";
  } else if (
    queryLower.includes("uk") ||
    queryLower.includes("united kingdom")
  ) {
    country = "United Kingdom";
    countryDcid = "country/GBR";
  } else if (queryLower.includes("france")) {
    country = "France";
    countryDcid = "country/FRA";
  } else if (queryLower.includes("canada")) {
    country = "Canada";
    countryDcid = "country/CAN";
  } else if (queryLower.includes("australia")) {
    country = "Australia";
    countryDcid = "country/AUS";
  }

  // Simple topic detection
  if (queryLower.includes("gdp") || queryLower.includes("economy"))
    topic = "gdp";
  else if (queryLower.includes("unemployment")) topic = "unemployment";
  else if (queryLower.includes("inflation")) topic = "inflation";
  else if (
    queryLower.includes("health") ||
    queryLower.includes("life expectancy")
  )
    topic = "health";
  else if (queryLower.includes("education") || queryLower.includes("literacy"))
    topic = "education";

  // First, search for relevant indicators
  const searchPayload = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "search_indicators",
      arguments: {
        query: topic,
        places: [country],
        include_topics: false,
      },
    },
    id: Math.random().toString(36).substring(7),
  };

  const searchResult = await fetchWithRetries(
    base.replace(/\/$/, "") + "/mcp",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(searchPayload),
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
        body: JSON.stringify(searchPayload),
      },
      10_000,
      0
    );
  });

  // Parse search results
  let searchData: any = null;
  if (searchResult?.result?.content?.[0]?.text) {
    try {
      searchData = JSON.parse(searchResult.result.content[0].text);
    } catch (e) {
      searchData = { text: searchResult.result.content[0].text };
    }
  }

  // If server returns our normalized shape already
  const parsed = QueryResultSchema.safeParse(searchData || searchResult);
  if (parsed.success) return parsed.data;

  // Handle MCP search_indicators response and fetch actual data
  if (searchData?.variables && Array.isArray(searchData.variables)) {
    const variables = searchData.variables;
    const dcidMappings = searchData.dcid_name_mappings || {};

    // Find the main population variable
    const mainVar =
      variables.find((v: any) => v.dcid === "Count_Person") || variables[0];
    const varName = dcidMappings[mainVar.dcid] || mainVar.dcid;

    // Now fetch actual data for the main variable
    const dataPayload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_observations",
        arguments: {
          variable_dcid: mainVar.dcid,
          place_dcid: countryDcid,
        },
      },
      id: Math.random().toString(36).substring(7),
    };

    try {
      const dataResult = await fetchWithRetries(
        base.replace(/\/$/, "") + "/mcp",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
          },
          body: JSON.stringify(dataPayload),
        },
        15_000,
        2
      );

      let dataResponse: any = null;
      if (dataResult?.result?.content?.[0]?.text) {
        try {
          dataResponse = JSON.parse(dataResult.result.content[0].text);
        } catch (e) {
          dataResponse = { text: dataResult.result.content[0].text };
        }
      }

      // Process the actual data
      if (
        dataResponse?.place_observations &&
        Array.isArray(dataResponse.place_observations)
      ) {
        const placeObs = dataResponse.place_observations[0];
        const timeSeries = placeObs?.time_series || [];

        // Create chart data from time series
        const chartData = {
          type: "line" as const,
          series: [
            {
              label: varName,
              points: timeSeries
                .map((point: any) => ({
                  x: point[0] || "", // year
                  y: point[1] || null, // value
                }))
                .filter((p: any) => p.y !== null),
            },
          ],
        };

        // Calculate summary statistics
        const values = timeSeries
          .map((point: any) => point[1])
          .filter((v: any) => typeof v === "number");
        const latestValue = values[values.length - 1];
        const growthRate =
          values.length > 1
            ? ((values[values.length - 1] - values[0]) / values[0]) * 100
            : null;

        return {
          answer: {
            title: `${varName} - ${country}`,
            note: `Population data. Latest value: ${
              latestValue?.toLocaleString() || "N/A"
            }. ${growthRate ? `Growth rate: ${growthRate.toFixed(1)}%` : ""}`,
            unit: "people",
            value: latestValue,
          },
          chart: chartData,
          sources: [
            {
              label: dataResponse.source_metadata?.importName || "Data Commons",
              url:
                dataResponse.source_metadata?.provenanceUrl ||
                "https://datacommons.org",
            },
          ],
          raw: { search: searchData, data: dataResponse },
        };
      }
    } catch (error) {
      console.error("Failed to fetch actual data:", error);
    }

    // Fallback to just showing available variables if data fetch fails
    return {
      answer: {
        title: "Population Variables Found",
        note: `Found ${variables.length} population-related variables for South Africa. Main variable: ${varName}`,
        unit: null,
        value: variables.length,
      },
      chart: undefined,
      sources: [{ label: "Data Commons", url: "https://datacommons.org" }],
      raw: searchData,
    };
  }

  // Heuristic mapping: attempt to build a friendly result
  const answerText: string | undefined =
    searchData?.answer?.text ||
    searchData?.text ||
    searchData?.summary ||
    searchResult?.answer?.text ||
    searchResult?.text ||
    searchResult?.summary;
  const unit = searchData?.unit ?? searchResult?.unit ?? null;
  const value =
    typeof searchData?.value === "number" ||
    typeof searchData?.value === "string"
      ? searchData.value
      : typeof searchResult?.value === "number" ||
        typeof searchResult?.value === "string"
      ? searchResult.value
      : undefined;

  const sources: Array<{ label: string; url: string }> = [];
  const citations =
    searchData?.citations ||
    searchData?.sources ||
    searchResult?.citations ||
    searchResult?.sources ||
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
    searchData?.series ||
    searchData?.timeSeries ||
    searchData?.timeseries ||
    searchResult?.series ||
    searchResult?.timeSeries ||
    searchResult?.timeseries;
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
    raw: searchData || searchResult,
  };
  return result;
}
