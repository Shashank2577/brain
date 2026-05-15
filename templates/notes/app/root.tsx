import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import {
  ClientOnly,
  DefaultSpinner,
  AgentSidebar,
  isInsideDispatchShell,
  getThemeInitScript,
} from "@agent-native/core/client";
import type { LinksFunction } from "react-router";
import stylesheet from "./global.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

const THEME_INIT_SCRIPT = getThemeInitScript("dark", false);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <meta name="theme-color" content="#10B981" />
        <title>Notes</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function ContentArea() {
  // When the dispatch super-app wraps this template in its iframe shell, hide
  // our own sidebar so the shell can render its global agent chat. Same
  // pattern every Phase 3 template follows — see ADR-002.
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(isInsideDispatchShell());
  }, []);

  if (embedded) return <Outlet />;

  return (
    <AgentSidebar
      position="right"
      defaultOpen
      defaultSidebarWidth={420}
      emptyStateText="Ask me anything about your notes"
      suggestions={[
        "Create a note about today's standup",
        "Find my notes about pricing",
        "Summarize my notes from the meeting",
      ]}
    >
      <Outlet />
    </AgentSidebar>
  );
}

export default function Root() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ClientOnly fallback={<DefaultSpinner />}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <ContentArea />
        </QueryClientProvider>
      </ThemeProvider>
    </ClientOnly>
  );
}

export { ErrorBoundary } from "@agent-native/core/client";
