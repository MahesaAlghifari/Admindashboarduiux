import { QueryClient } from "@tanstack/react-query";

function shouldRetry(failureCount, error) {
  const status = Number(error?.status ?? error?.response?.status ?? 0);

  // Validation/auth/permission/not-found errors should not be repeated.
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }

  // One automatic retry is enough for transient network/server errors.
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
