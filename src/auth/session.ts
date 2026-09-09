export interface AuthUser {
  id?: number | string | null;
  staffid?: number | string | null;
  nip?: string | null;
  nik?: string | null;
  fullname?: string | null;
  email?: string | null;
  role?: string | null;
  position?: string | null;
  jabatan?: string | null;
  nama_jabatan?: string | null;
  kepegawaian?: {
    jabatan?: string | null;
    [key: string]: unknown;
  } | null;
  photo?: string | null;
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  tokenType?: string;
  user?: AuthUser | null;
}

const STORAGE_KEY = "auth_session";
const AUTH_EVENT = "auth:change";

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const session = JSON.parse(raw) as AuthSession;

    if (!session?.accessToken) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session)
  );

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAccessToken() {
  return getAuthSession()?.accessToken ?? "";
}

export function getCurrentUser() {
  return getAuthSession()?.user ?? null;
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function subscribeAuth(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
