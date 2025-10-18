import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return null;
          }

          const payload = (await response.json().catch(() => null)) as
            | { token?: string; user?: { id: string; email: string; role?: string } }
            | null;

          if (!payload?.token || !payload.user) {
            return null;
          }

          return {
            ...payload.user,
            role: payload.user.role ?? "admin",
            accessToken: payload.token,
          };
        } catch (error) {
          console.error("Failed to authenticate", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "admin";
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user = {
          ...session.user,
          role: token.role as string,
        };
      }

      if (token?.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
