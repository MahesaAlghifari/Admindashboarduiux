import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";

import AuthProvider from "./auth/AuthProvider";
import AppRouter from "./app/router";
import { queryClient } from "./lib/queryClient";
import ErrorBoundary from "./components/common/ErrorBoundary";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);