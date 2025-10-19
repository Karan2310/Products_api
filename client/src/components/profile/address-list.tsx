"use client";

import { useMemo, useState } from "react";
import { Building2, Home, MapPin, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { AddressFormDialog } from "./address-form-dialog";
import { useProfile, type ProfileAddress } from "./profile-provider";

export function AddressList() {
  const { addresses, deleteAddress, setDefaultAddress } = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ProfileAddress | null>(null);

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
  }, [addresses]);

  const handleEdit = (address: ProfileAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSetDefault = async (address: ProfileAddress) => {
    try {
      await setDefaultAddress(address.id);
      toast.success("Default address updated", {
        description: `${address.label} is now your default shipping address.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update address");
    }
  };

  const handleDelete = async (address: ProfileAddress) => {
    try {
      await deleteAddress(address.id);
      toast.success("Address removed", {
        description: `${address.label} was removed from your profile.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove address");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">Add multiple addresses and pick a default for faster checkout.</p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditingAddress(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {sortedAddresses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          <MapPin className="h-6 w-6" />
          <span>No addresses yet. Add one to speed up checkout.</span>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedAddresses.map((address) => {
            const Icon =
              address.label === "Office" ? Building2 : address.label === "Other" ? MapPin : Home;

            return (
            <Card key={address.id} className="relative space-y-3 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {address.label}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.recipient}
                    {address.phone ? ` • ${address.phone}` : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleEdit(address)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSetDefault(address)} disabled={address.isDefault}>
                      <Home className="mr-2 h-4 w-4" /> Set default
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleDelete(address)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>

              {address.isDefault ? (
                <Badge variant="secondary" className="rounded-full text-xs">
                  Default address
                </Badge>
              ) : null}
            </Card>
          );
          })}
        </div>
      )}

      <AddressFormDialog address={editingAddress} open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
