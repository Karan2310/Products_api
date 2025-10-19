"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";

import { CartProvider } from "@/components/cart/cart-provider";
import { PendingCartSync } from "@/components/cart/pending-cart-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProfileProvider } from "@/components/profile/profile-provider";

interface AppProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <ProfileProvider>
              <PendingCartSync />
              {children}
            </ProfileProvider>
            <Toaster position="bottom-left" richColors duration={4000} />
          </CartProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
