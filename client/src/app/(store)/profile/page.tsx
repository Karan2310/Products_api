import type { Metadata } from "next";

import { ProfileBasicsForm } from "@/components/profile/profile-basics-form";
import { AddressList } from "@/components/profile/address-list";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal details and saved addresses for faster checkout.",
};

export default function ProfilePage() {
  return (
    <div className="container space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your personal details and manage addresses used during checkout.
        </p>
      </header>

      <section className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Basic information</h2>
        <p className="text-sm text-muted-foreground">
          These details will be used on invoices and to pre-fill shipping forms.
        </p>
        <div className="mt-6">
          <ProfileBasicsForm />
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm">
        <AddressList />
      </section>
    </div>
  );
}
