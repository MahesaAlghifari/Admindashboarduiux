import {
  clearAuthSession,
  getAuthSession,
} from "../auth/session";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/+$/, "");

export type ApiRequestInit = RequestInit & {
  jsonBody?: unknown;
  skipAuth?: boolean;
};

export type ApiGetInit = Omit<RequestInit, "method" | "body"> & {
  skipAuth?: boolean;
};

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  if (!apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL belum dikonfigurasi."
    );
  }

  return `${apiBaseUrl}${normalizedPath}`;
}

async function readResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function formatValidationLocation(location: unknown) {
  if (!Array.isArray(location)) {
    return "";
  }

  return location
    .filter((item) => item !== "body")
    .map(String)
    .join(".");
}

function getErrorMessage(
  status: number,
  statusText: string,
  body: unknown
) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body
  ) {
    const detail = body.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (!item || typeof item !== "object") {
            return String(item);
          }

          const location =
            "loc" in item
              ? formatValidationLocation(item.loc)
              : "";

          const message =
            "msg" in item
              ? String(item.msg)
              : "Data tidak valid";

          return location
            ? `${location}: ${message}`
            : message;
        })
        .join(", ");
    }
  }

  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return statusText
    ? `Request gagal (${status} ${statusText})`
    : `Request gagal (${status})`;
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "name" in error && error.name === "AbortError";
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(
    message: string,
    status: number,
    body: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiRequestJson<T>(
  path: string,
  init?: ApiRequestInit
): Promise<T> {
  const {
    jsonBody,
    skipAuth = false,
    ...rest
  } = init ?? {};

  const method = String(
    rest.method ?? "GET"
  ).toUpperCase();

  const session = skipAuth
    ? null
    : getAuthSession();

  const headers = new Headers(rest.headers);

  headers.set("Accept", "application/json");

  if (session?.accessToken) {
    headers.set(
      "Authorization",
      `${session.tokenType?.trim() || "Bearer"} ${session.accessToken}`
    );
  }

  if (
    jsonBody !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = buildUrl(path);

  let response: Response;

  try {
    response = await fetch(url, {
      ...rest,
      method,
      headers,
      cache:
        rest.cache ??
        (method === "GET" ? "no-store" : undefined),
      body:
        jsonBody !== undefined
          ? JSON.stringify(jsonBody)
          : rest.body,
    });
  } catch (error) {
    // Preserve AbortError so TanStack Query/fetch consumers know
    // this request was intentionally cancelled, not a network failure.
    if (isAbortError(error)) {
      throw error;
    }

    throw new Error(
      `Tidak dapat terhubung ke API: ${url}`
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    if (
      response.status === 401 &&
      !skipAuth &&
      session?.accessToken
    ) {
      clearAuthSession();
    }

    throw new ApiError(
      getErrorMessage(
        response.status,
        response.statusText,
        body
      ),
      response.status,
      body
    );
  }

  return body as T;
}

export async function apiGetJson<T>(
  path: string,
  init?: ApiGetInit
): Promise<T> {
  return apiRequestJson<T>(path, {
    ...init,
    method: "GET",
  });
}
