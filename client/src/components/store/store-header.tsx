"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShoppingCart, UserRound } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMemo } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
];

export function StoreHeader() {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const isUser = session?.user?.role === "user";
  const navItems = useMemo(() => {
    if (isUser) {
      return [
        ...navLinks,
        { href: "/dashboard", label: "My Orders" },
      ];
    }

    return navLinks;
  }, [isUser]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/shop" });
  };

  const handleLoginNavigation = () => {
    router.push("/login");
  };

  const handleRegisterNavigation = () => {
    router.push("/register");
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/shop" className="text-lg font-semibold">
            Products Portal
          </Link>
          <nav className="hidden gap-4 text-sm font-medium md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative inline-flex items-center">
            <Button variant="outline" size="icon" aria-label="View cart">
              <ShoppingCart className="h-4 w-4" />
            </Button>
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground">
                {totalItems}
              </span>
            ) : null}
          </Link>

          {session?.user ? (
            <>
              {isUser ? (
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted md:flex"
                >
                  <UserRound className="h-4 w-4" />
                  <span>{session.user.name ?? "Account"}</span>
                </Link>
              ) : null}
              <Button variant="secondary" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleLoginNavigation}>
                Sign in
              </Button>
              <Button className="hidden sm:inline-flex" onClick={handleRegisterNavigation}>
                Create account
              </Button>
            </>
          )}

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
