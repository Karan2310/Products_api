import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { ModeToggle } from "@/components/mode-toggle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

type LoginSearchParams = Record<string, string | string[] | undefined>;

interface LoginPageProps {
  searchParams?: Promise<LoginSearchParams>;
}

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your Products Portal account to manage orders and preferences.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "admin") {
      redirect("/admin");
    }

    redirect("/shop");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const redirectToParam = resolvedParams.redirect;
  const redirectTarget = Array.isArray(redirectToParam)
    ? redirectToParam[0]
    : redirectToParam;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTarget} />
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Don&apos;t have an account?&nbsp;
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
