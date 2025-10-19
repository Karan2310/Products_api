"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  upsertAddress: (address: Omit<ProfileAddress, "id"> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateBasics: (basics: ProfileBasics) => void;
};

const STORAGE_KEY = "products_profile_v1";

const defaultState: ProfileState = {
  basics: {
    name: "",
    email: "",
    phone: "",
  },
  addresses: [],
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const loadInitialState = (): ProfileState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as Partial<ProfileState>;
    const addresses = Array.isArray(parsed.addresses)
      ? parsed.addresses.map((address, index) => ({
          id: address?.id ?? `addr-${index}-${Math.random().toString(36).slice(2)}`,
          label: address?.label ?? "Home",
          recipient: address?.recipient ?? parsed.basics?.name ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          city: address?.city ?? "",
          state: address?.state ?? "",
          postalCode: address?.postalCode ?? "",
          country: address?.country ?? "",
          phone: address?.phone ?? parsed.basics?.phone ?? "",
          isDefault: Boolean(address?.isDefault),
        }))
      : [];

    if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
      addresses[0] = { ...addresses[0], isDefault: true };
    }

    return {
      basics: {
        name: parsed.basics?.name ?? "",
        email: parsed.basics?.email ?? "",
        phone: parsed.basics?.phone ?? "",
      },
      addresses,
    } satisfies ProfileState;
  } catch (error) {
    console.warn("Failed to parse profile state", error);
    return defaultState;
  }
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProfileState>(() => loadInitialState());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<ProfileContextValue>(() => {
    const upsertAddress: ProfileContextValue["upsertAddress"] = (address) => {
      setState((current) => {
        const id = address.id ?? `addr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const existingIndex = current.addresses.findIndex((item) => item.id === id);
        let nextAddresses: ProfileAddress[] = [];

        if (existingIndex === -1) {
          nextAddresses = [
            ...current.addresses,
            {
              ...address,
              id,
              isDefault: current.addresses.length === 0 ? true : Boolean(address.isDefault),
            },
          ];
        } else {
          nextAddresses = [...current.addresses];
          nextAddresses[existingIndex] = {
            ...nextAddresses[existingIndex],
            ...address,
            id,
          };
        }

        if (address.isDefault) {
          nextAddresses = nextAddresses.map((item) => ({
            ...item,
            isDefault: item.id === id,
          }));
        }

        return {
          ...current,
          addresses: nextAddresses,
        } satisfies ProfileState;
      });
    };

    const deleteAddress: ProfileContextValue["deleteAddress"] = (id) => {
      setState((current) => {
        const next = current.addresses.filter((address) => address.id !== id);
        if (next.length > 0 && !next.some((address) => address.isDefault)) {
          next[0] = { ...next[0], isDefault: true };
        }
        return {
          ...current,
          addresses: next,
        };
      });
    };

    const setDefaultAddress: ProfileContextValue["setDefaultAddress"] = (id) => {
      setState((current) => ({
        ...current,
        addresses: current.addresses.map((address) => ({
          ...address,
          isDefault: address.id === id,
        })),
      }));
    };

    const updateBasics: ProfileContextValue["updateBasics"] = (basics) => {
      setState((current) => ({
        ...current,
        basics: {
          ...basics,
        },
      }));
    };

    return {
      basics: state.basics,
      addresses: state.addresses,
      upsertAddress,
      deleteAddress,
      setDefaultAddress,
      updateBasics,
    } satisfies ProfileContextValue;
  }, [state]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
