"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, ShoppingCart, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useMemo } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/profile", label: "Profile" },
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

  const handleAuthNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-3 md:py-2.5">
        <div className="flex flex-1 items-center gap-2">
          <Link href="/shop" className="flex items-center gap-2 text-lg font-semibold">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs uppercase text-primary">
              PP
            </span>
            Products Portal
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-sm">
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                Browse
              </DropdownMenuLabel>
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full items-center justify-between",
                      pathname.startsWith(item.href)
                        ? "font-medium text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                    {pathname.startsWith(item.href) ? (
                      <span aria-hidden className="text-[0.6rem] text-primary">●</span>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                Account
              </DropdownMenuLabel>
              {session?.user ? (
                <>
                  {isUser ? (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex w-full justify-between">
                        My Orders
                        {pathname.startsWith("/dashboard") ? (
                          <span aria-hidden className="text-[0.6rem] text-primary">●</span>
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onSelect={() => handleSignOut()}>
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full">
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="w-full">
                      Create account
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <Link href="/cart" className="relative inline-flex items-center">
            <Button
              variant="outline"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3"
              aria-label="View cart"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Cart</span>
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
                  className="hidden items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium hover:bg-muted md:inline-flex"
                >
                  <UserRound className="h-4 w-4" />
                  <span>{session.user.name ?? "Account"}</span>
                </Link>
              ) : null}
              <Button variant="secondary" className="rounded-full px-3 py-1.5 text-sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm">
                    <UserRound className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-sm">
                  <DropdownMenuItem onSelect={() => handleAuthNavigation("/login")}>
                    Sign in
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleAuthNavigation("/register")}>
                    Create account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
