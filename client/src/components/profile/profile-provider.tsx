"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type ProfileBasics = {
  name: string;
  email: string;
  phone: string;
};

export type ProfileAddress = {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
};

type ProfileState = {
  basics: ProfileBasics;
  addresses: ProfileAddress[];
};

type ProfileContextValue = {
  basics: ProfileBasics;
  addresses: ProfileAddress[];
  loading: boolean;
  refresh: () => Promise<void>;
  upsertAddress: (address: Omit<ProfileAddress, "id"> & { id?: string }) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  updateBasics: (basics: ProfileBasics) => Promise<void>;
};

const defaultState: ProfileState = {
  basics: {
    name: "",
    email: "",
    phone: "",
  },
  addresses: [],
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

type ApiAddress = Partial<Omit<ProfileAddress, "label" | "isDefault">> & {
  id?: string;
  label?: ProfileAddress["label"] | string;
  isDefault?: boolean;
};

const normalizeAddresses = (
  addresses: ApiAddress[] | undefined,
  fallbackName: string,
  fallbackPhone: string,
): ProfileAddress[] => {
  if (!Array.isArray(addresses)) {
    return [];
  }

  return addresses.map((entry, index) => ({
    id: entry.id ?? `addr-${index}-${Math.random().toString(36).slice(2)}`,
    label: (entry.label === "Office" || entry.label === "Other" ? entry.label : "Home") as ProfileAddress["label"],
    recipient: entry.recipient ?? fallbackName,
    line1: entry.line1 ?? "",
    line2: entry.line2 ?? "",
    city: entry.city ?? "",
    state: entry.state ?? "",
    postalCode: entry.postalCode ?? "",
    country: entry.country ?? "",
    phone: entry.phone ?? fallbackPhone,
    isDefault: Boolean(entry.isDefault),
  }));
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProfileState>(defaultState);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const accessToken = session?.accessToken;

  const fetchProfile = useCallback(async () => {
    if (!apiBaseUrl || status !== "authenticated" || !accessToken) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setState(defaultState);
          return;
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to load profile");
      }

      const data: {
        basics?: Partial<ProfileBasics>;
        addresses?: Array<
          Partial<Omit<ProfileAddress, "label" | "isDefault">> & {
            id?: string;
            label?: ProfileAddress["label"] | string;
            isDefault?: boolean;
          }
        >;
      } = await response.json();
      setState({
        basics: {
          name: data.basics?.name ?? "",
          email: data.basics?.email ?? "",
          phone: data.basics?.phone ?? "",
        },
        addresses: Array.isArray(data.addresses)
          ? data.addresses.map((address, index) => ({
              id: address.id ?? `addr-${index}-${Math.random().toString(36).slice(2)}`,
              label: (address.label === "Office" || address.label === "Other" ? address.label : "Home") as ProfileAddress["label"],
              recipient: address.recipient ?? data.basics?.name ?? "",
              line1: address.line1 ?? "",
              line2: address.line2 ?? "",
              city: address.city ?? "",
              state: address.state ?? "",
              postalCode: address.postalCode ?? "",
              country: address.country ?? "",
              phone: address.phone ?? data.basics?.phone ?? "",
              isDefault: Boolean(address.isDefault),
            }))
          : [],
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, accessToken, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setState(defaultState);
      setLoading(false);
      return;
    }

    void fetchProfile();
  }, [status, fetchProfile]);

  const updateBasics = useCallback<ProfileContextValue["updateBasics"]>(
    async (basics) => {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }
      if (status !== "authenticated" || !accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${apiBaseUrl}/api/profile/basics`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(basics),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to update profile");
      }

      const data: {
        basics?: Partial<ProfileBasics>;
        addresses?: Array<
          Partial<Omit<ProfileAddress, "label" | "isDefault">> & {
            id?: string;
            label?: ProfileAddress["label"] | string;
            isDefault?: boolean;
          }
        >;
      } = await response.json();
      setState((current) => ({
        ...current,
        basics: {
          name: data.basics?.name ?? basics.name,
          email: data.basics?.email ?? basics.email,
          phone: data.basics?.phone ?? basics.phone,
        },
      }));
    },
    [apiBaseUrl, accessToken, status],
  );

  const upsertAddress = useCallback<ProfileContextValue["upsertAddress"]>(
    async (address) => {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }
      if (status !== "authenticated" || !accessToken) {
        throw new Error("Not authenticated");
      }

      const { id, ...payload } = address;
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${apiBaseUrl}/api/profile/addresses/${id}`
        : `${apiBaseUrl}/api/profile/addresses`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to save address");
      }

      const data: { addresses?: ApiAddress[] } = await response.json();
      setState((current) => ({
        ...current,
        addresses: normalizeAddresses(data.addresses, current.basics.name, current.basics.phone),
      }));
    },
    [apiBaseUrl, accessToken, status],
  );

  const deleteAddress = useCallback<ProfileContextValue["deleteAddress"]>(
    async (id) => {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }
      if (status !== "authenticated" || !accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${apiBaseUrl}/api/profile/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to delete address");
      }

      const data: { addresses?: ApiAddress[] } = await response.json();
      setState((current) => ({
        ...current,
        addresses: normalizeAddresses(data.addresses, current.basics.name, current.basics.phone),
      }));
    },
    [apiBaseUrl, accessToken, status],
  );

  const setDefaultAddress = useCallback<ProfileContextValue["setDefaultAddress"]>(
    async (id) => {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }
      if (status !== "authenticated" || !accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${apiBaseUrl}/api/profile/addresses/${id}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to update default address");
      }

      const data: { addresses?: ApiAddress[] } = await response.json();
      setState((current) => ({
        ...current,
        addresses: normalizeAddresses(data.addresses, current.basics.name, current.basics.phone),
      }));
    },
    [apiBaseUrl, accessToken, status],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      basics: state.basics,
      addresses: state.addresses,
      loading,
      refresh: fetchProfile,
      upsertAddress,
      deleteAddress,
      setDefaultAddress,
      updateBasics,
    }),
    [state.basics, state.addresses, loading, fetchProfile, upsertAddress, deleteAddress, setDefaultAddress, updateBasics],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
