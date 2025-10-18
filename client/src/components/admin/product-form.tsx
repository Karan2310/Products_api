"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import type { Product } from "@/types/products";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(5000),
  price: z
    .string()
    .min(1, "Enter a price")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Enter a valid price",
    }),
  category: z.string().min(1, "Category is required").max(120),
  stock: z
    .string()
    .min(1, "Enter stock")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, {
      message: "Stock must be a non-negative whole number",
    }),
});

export type ProductFormValues = z.infer<typeof schema>;

type NormalizedProductFormValues = {
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
};

export interface ProductFormSubmitPayload {
  values: NormalizedProductFormValues;
  existingImages: string[];
  newFiles: File[];
}

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  categoryOptions: string[];
  onSubmit: (payload: ProductFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  mode,
  product,
  categoryOptions,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProductFormProps) {
  const uniqueCategoryOptions = useMemo(
    () =>
      Array.from(new Set(categoryOptions))
        .map((option) => option.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [categoryOptions],
  );

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (!categoryOpen) {
      setCategorySearch("");
    }
  }, [categoryOpen]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: product?.title ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      category: product?.category ?? "",
      stock: product ? String(product.stock) : "",
    },
  });

  const [existingImages, setExistingImages] = useState<string[]>(
    product?.images ?? [],
  );

  type ImagePreview = {
    file: File;
    url: string;
    id: string;
  };

  const [newPreviews, setNewPreviews] = useState<ImagePreview[]>([]);
  const previewsRef = useRef<ImagePreview[]>([]);

  useEffect(() => {
    previewsRef.current = newPreviews;
  }, [newPreviews]);

  useEffect(() => {
    setExistingImages(product?.images ?? []);
    form.reset({
      title: product?.title ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      category: product?.category ?? "",
      stock: product ? String(product.stock) : "",
    });
    setNewPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  const removeExistingImage = (url: string) => {
    setExistingImages((images) => images.filter((image) => image !== url));
  };

  const removeNewFile = (id: string) => {
    setNewPreviews((current) => {
      const remaining = current.filter((preview) => preview.id !== id);
      const removed = current.find((preview) => preview.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return remaining;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }

    const incoming = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    }));

    setNewPreviews((current) => {
      const total = current.length + incoming.length + existingImages.length;

      if (total > 10) {
        toast.error("Image limit reached", {
          description: "You can attach up to 10 images per product.",
        });
      }

      const allowed = Math.max(0, 10 - existingImages.length - current.length);
      const accepted = incoming.slice(0, allowed);
      const rejected = incoming.slice(allowed);
      rejected.forEach((preview) => URL.revokeObjectURL(preview.url));

      return [...current, ...accepted];
    });
    event.target.value = "";
  };

  const submit = async (values: ProductFormValues) => {
    const normalized: NormalizedProductFormValues = {
      title: values.title,
      description: values.description,
      category: values.category,
      price: Number(values.price),
      stock: Number(values.stock),
    };

    await onSubmit({
      values: normalized,
      existingImages,
      newFiles: newPreviews.map((preview) => preview.file),
    });
    setNewPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return [];
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Product title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (INR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1499.99"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className="w-full justify-between"
                      >
                        {field.value ? field.value : "Select category"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search categories..."
                          value={categorySearch}
                          onValueChange={setCategorySearch}
                        />
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup heading="Suggestions">
                            {uniqueCategoryOptions.map((option) => (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={(value) => {
                                  field.onChange(value);
                                  setCategoryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === option
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {option}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {categorySearch.trim().length > 0 &&
                            !uniqueCategoryOptions
                              .map((option) => option.toLowerCase())
                              .includes(categorySearch.trim().toLowerCase()) && (
                              <>
                                <CommandSeparator />
                                <CommandGroup heading="Create">
                                  <CommandItem
                                    value={categorySearch.trim()}
                                    onSelect={(value) => {
                                      field.onChange(value);
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create {categorySearch.trim()}
                                  </CommandItem>
                                </CommandGroup>
                              </>
                            )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={5} placeholder="Describe the product" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Images</h3>
              <p className="text-xs text-muted-foreground">
                Upload up to 10 images. JPG, PNG, WEBP, GIF, AVIF supported.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <label className="cursor-pointer">
                Add images
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </Button>
          </div>

        <div className="grid max-h-80 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
            {existingImages.map((url) => (
              <figure
                key={url}
                className="relative overflow-hidden rounded-lg border"
              >
                <Image
                  src={url}
                  alt="Product image"
                  width={300}
                  height={300}
                  className="h-32 w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => removeExistingImage(url)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </figure>
            ))}

            {newPreviews.map((preview) => (
              <figure
                key={preview.id}
                className="relative overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-32 w-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => removeNewFile(preview.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </figure>
            ))}

            {existingImages.length === 0 && newPreviews.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground sm:col-span-3">
                No images selected yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating" : "Updating"}
              </span>
            ) : mode === "create" ? (
              "Create product"
            ) : (
              "Update product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
