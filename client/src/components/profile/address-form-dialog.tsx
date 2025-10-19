"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useProfile, type ProfileAddress } from "./profile-provider";

const labelOptions = ["Home", "Office", "Other"] as const;

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.enum(labelOptions),
  recipient: z.string().min(1, "Recipient name is required"),
  line1: z.string().min(1, "Address line is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  address?: ProfileAddress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressFormDialog({ address, open, onOpenChange }: AddressFormDialogProps) {
  const { upsertAddress, basics } = useProfile();

  const normalizeLabel = (value?: string | null): AddressFormValues["label"] => {
    return labelOptions.includes(value as AddressFormValues["label"]) ? (value as AddressFormValues["label"]) : "Home";
  };

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      id: address?.id,
      label: normalizeLabel(address?.label),
      recipient: address?.recipient ?? basics.name,
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? basics.phone,
      isDefault: address?.isDefault ?? false,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset({
      id: address?.id,
      label: normalizeLabel(address?.label),
      recipient: address?.recipient ?? basics.name,
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? basics.phone,
      isDefault: address?.isDefault ?? false,
    });
  }, [address, basics.name, basics.phone, form, open]);

  const submit = (values: AddressFormValues) => {
    upsertAddress({
      ...values,
      isDefault: Boolean(values.isDefault),
    });
    toast.success(address ? "Address updated" : "Address added", {
      description: Boolean(values.isDefault)
        ? "This address is now your default shipping address."
        : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add new address"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <Input placeholder="Recipient name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 0100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, building" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartment, floor (optional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input placeholder="ZIP/Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 text-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <span className="text-muted-foreground">Set as default address</span>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save address
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
