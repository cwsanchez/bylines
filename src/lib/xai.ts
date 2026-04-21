import { env, hasGrok } from "./env";

export class GrokError extends Error {
  constructor(message: string, public status: number, public detail?: string) {
    super(message);
    this.name = "GrokError";
  }
}

export interface GrokCitation {
  url: string;
  title?: string;
}

export interface GrokResponse<T> {
  data: T;
  citations: GrokCitation[];
  /** The final text payload returned by the model (already parsed into data). */
  rawText: string;
  /** Approximate token usage when the API returns it. */
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    num_sources_used?: number;
  };
}

export interface XSearchConfig {
  allowed_x_handles?: string[];
  excluded_x_handles?: string[];
  from_date?: string;
  to_date?: string;
}

export interface WebSearchConfig {
  allowed_domains?: string[];
  excluded_domains?: string[];
}

export interface CallGrokOptions {
  instructions?: string;
  input: string;
  jsonSchema: {
    name: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
  xSearch?: XSearchConfig;
  webSearch?: WebSearchConfig;
  model?: string;
  /** Abort signal for long-running generations. */
  signal?: AbortSignal;
}

/**
 * Call xAI's Responses API with web_search and x_search tools enabled and
 * force a JSON-schema response. Returns parsed JSON + a flat list of URL
 * citations discovered during tool use.
 */
export async function callGrokJSON<T>(
  opts: CallGrokOptions,
): Promise<GrokResponse<T>> {
  if (!hasGrok()) {
    throw new GrokError("XAI_API_KEY is not configured", 500);
  }

  const tools: Array<Record<string, unknown>> = [
    { type: "web_search", ...(opts.webSearch ?? {}) },
    { type: "x_search", ...(opts.xSearch ?? {}) },
  ];

  const input: Array<Record<string, unknown>> = [];
  if (opts.instructions) {
    input.push({ role: "system", content: opts.instructions });
  }
  input.push({ role: "user", content: opts.input });

  const body = {
    model: opts.model ?? env.XAI_MODEL,
    input,
    tools,
    text: {
      format: {
        type: "json_schema",
        name: opts.jsonSchema.name,
        schema: opts.jsonSchema.schema,
        strict: opts.jsonSchema.strict ?? true,
      },
    },
  };

  const res = await fetch(env.XAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => undefined);
    throw new GrokError(
      `xAI request failed: ${res.status}`,
      res.status,
      detail,
    );
  }

  const json = (await res.json()) as XAIResponseShape;

  const message = (json.output ?? []).find(
    (o): o is XAIMessageOutput => o.type === "message",
  );
  const textPart = message?.content?.find(
    (c): c is XAITextContent => c.type === "output_text",
  );
  const rawText = textPart?.text ?? "";
  let parsed: T;
  try {
    parsed = JSON.parse(rawText) as T;
  } catch {
    throw new GrokError(
      "Failed to parse JSON from Grok response",
      500,
      rawText.slice(0, 500),
    );
  }

  const citations = new Map<string, GrokCitation>();
  for (const ann of textPart?.annotations ?? []) {
    if (ann.type === "url_citation" && ann.url) {
      if (!citations.has(ann.url)) {
        citations.set(ann.url, { url: ann.url, title: ann.title });
      }
    }
  }

  return {
    data: parsed,
    citations: Array.from(citations.values()),
    rawText,
    usage: json.usage,
  };
}

interface XAIResponseShape {
  output?: Array<XAIOutput>;
  usage?: GrokResponse<unknown>["usage"];
  error?: { message?: string } | string | null;
}

type XAIOutput = XAIMessageOutput | { type: string };

interface XAIMessageOutput {
  type: "message";
  id?: string;
  role?: string;
  content?: Array<XAITextContent | { type: string }>;
}

interface XAITextContent {
  type: "output_text";
  text: string;
  annotations?: Array<{
    type: string;
    url?: string;
    title?: string;
    start_index?: number;
    end_index?: number;
  }>;
}
