import { ReactNode } from "react";

import { StoreHeader } from "@/components/store/store-header";

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1 bg-muted/20 pb-12 pt-8">{children}</main>
      <footer className="border-t bg-background/80">
        <div className="container py-6 text-sm text-muted-foreground">
          &copy; {currentYear} Products Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
