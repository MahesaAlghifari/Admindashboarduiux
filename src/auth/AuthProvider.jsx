import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMe,
  login as loginRequest,
} from "../api/auth";

import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuth,
} from "./session";

import { AuthContext } from "./useAuth";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    getAuthSession()
  );

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  const syncSession = useCallback(() => {
    setSession(getAuthSession());
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeAuth(() => {
      if (active) {
        syncSession();
      }
    });

    const initialize = async () => {
      const current = getAuthSession();

      if (!current?.accessToken) {
        if (active) {
          setSession(null);
          setIsInitializing(false);
        }

        return;
      }

      try {
        const me = await getMe();

        const nextSession = {
          ...current,
          user: {
            ...(current.user ?? {}),
            ...(me ?? {}),
            role:
              me?.role ??
              current.user?.role ??
              null,
          },
        };

        setAuthSession(nextSession);

        if (active) {
          setSession(nextSession);
        }
      } catch (error) {
        if (error?.status === 401) {
          clearAuthSession();

          if (active) {
            setSession(null);
          }
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [syncSession]);

  const login = useCallback(
    async ({ nik, password }) => {
      setIsAuthenticating(true);

      try {
        const auth = await loginRequest({
          nik,
          password,
        });

        const temporarySession = {
          accessToken: auth.access_token,
          tokenType:
            auth.token_type || "Bearer",
          user: {
            nik: nik.trim(),
            role: auth.role || null,
          },
        };

        setAuthSession(temporarySession);
        setSession(temporarySession);

        try {
          const me = await getMe();

          const authenticatedSession = {
            ...temporarySession,
            user: {
              ...temporarySession.user,
              ...(me ?? {}),
              role:
                me?.role ??
                auth.role ??
                null,
            },
          };

          setAuthSession(authenticatedSession);
          setSession(authenticatedSession);

          return authenticatedSession;
        } catch (error) {
          if (error?.status === 401) {
            clearAuthSession();
            setSession(null);
            throw error;
          }

          return temporarySession;
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken:
        session?.accessToken ?? "",
      role:
        session?.user?.role ?? null,
      isAuthenticated: Boolean(
        session?.accessToken
      ),
      isInitializing,
      isAuthenticating,
      login,
      logout,
    }),
    [
      session,
      isInitializing,
      isAuthenticating,
      login,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}