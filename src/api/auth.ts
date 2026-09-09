import {
  apiGetJson,
  apiRequestJson,
} from "./http";

import type {
  AuthSession,
  AuthUser,
} from "../auth/session";

export interface LoginRequest {
  nik: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

type AuthMeEnvelope = {
  status?: string;
  message?: string;
  data?: AuthUser | null;
  user?: AuthUser | null;
};

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractAuthUser(
  response: unknown
): AuthUser {
  if (!isObject(response)) {
    throw new Error(
      "Response profil pengguna tidak valid."
    );
  }

  const envelope =
    response as AuthMeEnvelope;

  if (
    envelope.data &&
    isObject(envelope.data)
  ) {
    return envelope.data;
  }

  if (
    envelope.user &&
    isObject(envelope.user)
  ) {
    return envelope.user;
  }

  return response as AuthUser;
}

export async function login(
  payload: LoginRequest
): Promise<LoginResponse> {
  const response =
    await apiRequestJson<LoginResponse>(
      "/api/auth/login",
      {
        method: "POST",
        skipAuth: true,
        jsonBody: {
          nik: payload.nik.trim(),
          password: payload.password,
        },
      }
    );

  if (!response?.access_token) {
    throw new Error(
      "Token autentikasi tidak ditemukan."
    );
  }

  return response;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiGetJson<unknown>(
    "/api/auth/me"
  );

  return extractAuthUser(response);
}

export async function loginAndGetSession(
  payload: LoginRequest
): Promise<AuthSession> {
  const auth = await login(payload);

  const temporarySession: AuthSession = {
    accessToken: auth.access_token,
    tokenType:
      auth.token_type || "Bearer",
    user: {
      nik: payload.nik.trim(),
      role: auth.role || null,
    },
  };

  return temporarySession;
}