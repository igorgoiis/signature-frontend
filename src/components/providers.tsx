
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/toaster";
import { useState, useEffect } from "react";
import SessionHandler from "./session-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dados serão considerados "stale" (velhos) após 5 minutos, isso significa que eles serão re-buscados em segundo plano se o componente for montado novamente após esse tempo.
      refetchOnWindowFocus: true, // Re-busca dados quando a janela do navegador ganha foco
      retry: 2, // Tenta novamente 2 vezes em caso de falha na requisição
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <SessionHandler>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </SessionHandler>
    </SessionProvider>
  );
}
