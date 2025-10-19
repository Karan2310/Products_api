"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useProfile } from "./profile-provider";

const basicsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^[+0-9\-() ]*$/, "Enter a valid phone")
    .min(6, "Enter a valid phone"),
});

type BasicsFormValues = z.infer<typeof basicsSchema>;

export function ProfileBasicsForm() {
  const { basics, updateBasics } = useProfile();

  const form = useForm<BasicsFormValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: basics,
  });

  useEffect(() => {
    form.reset(basics);
  }, [basics, form]);

  const submit = (values: BasicsFormValues) => {
    updateBasics(values);
    toast.success("Details saved", {
      description: "Your profile information was updated.",
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 555 0100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="outline">
            Save details
          </Button>
        </div>
      </form>
    </Form>
  );
}
