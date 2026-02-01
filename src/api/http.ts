const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  ""
);

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}

async function readErrorBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      return JSON.stringify(json);
    } catch {
      return "";
    }
  }

  return await response.text().catch(() => "");
}

export async function apiRequestJson<T>(
  path: string,
  init?: RequestInit & { jsonBody?: unknown }
): Promise<T> {
  const { jsonBody, ...rest } = init ?? {};

  const method = String(rest.method ?? "GET").toUpperCase();

  const response = await fetch(buildUrl(path), {
    ...rest,
    // Prevent stale lists after external BE changes (e.g. migrate:fresh)
    cache: rest.cache ?? (method === "GET" ? "no-store" : undefined),
    headers: {
      Accept: "application/json",
      ...(method === "GET" ? { "Cache-Control": "no-cache" } : {}),
      ...(jsonBody !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : rest.body,
  });

  if (!response.ok) {
    const text = await readErrorBody(response);
    throw new Error(
      `Request failed (${response.status})${text ? `: ${text}` : ""}`
    );
  }

  // Some endpoints might return 204 No Content
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function apiGetJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return apiRequestJson<T>(path, { ...init, method: "GET" });
}
