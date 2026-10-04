"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import type { AppData, CollectionKey } from "@/lib/app-data";
import { createSeedData } from "@/lib/seed";
import { getNowISO } from "@/lib/dates";
import type { BaseEntity, ID } from "@/lib/types";
import type { RunningTimer } from "@/features/time/types";
import type { Settings } from "@/features/settings/types";

const STORAGE_KEY = "clientbrain:data";

export type DataAction =
  | { type: "ADD"; collection: CollectionKey; item: BaseEntity }
  | {
      type: "UPDATE";
      collection: CollectionKey;
      id: ID;
      patch: Record<string, unknown>;
    }
  | { type: "REMOVE"; collection: CollectionKey; id: ID }
  | {
      type: "RESTORE";
      collection: CollectionKey;
      item: BaseEntity;
      index: number;
    }
  | { type: "SET_RUNNING_TIMER"; timer: RunningTimer | null }
  | { type: "UPDATE_SETTINGS"; patch: Partial<Settings> }
  | { type: "HYDRATE"; data: AppData }
  | { type: "RESET" };

export function dataReducer(state: AppData, action: DataAction): AppData {
  switch (action.type) {
    case "ADD": {
      const list = state[action.collection] as unknown as BaseEntity[];
      return { ...state, [action.collection]: [...list, action.item] } as AppData;
    }
    case "UPDATE": {
      const list = state[action.collection] as unknown as BaseEntity[];
      const next = list.map((item) =>
        item.id === action.id
          ? { ...item, ...action.patch, updatedAt: getNowISO() }
          : item,
      );
      return { ...state, [action.collection]: next } as AppData;
    }
    case "REMOVE": {
      const list = state[action.collection] as unknown as BaseEntity[];
      return {
        ...state,
        [action.collection]: list.filter((item) => item.id !== action.id),
      } as AppData;
    }
    case "RESTORE": {
      const list = state[action.collection] as unknown as BaseEntity[];
      const next = [...list];
      next.splice(Math.min(action.index, next.length), 0, action.item);
      return { ...state, [action.collection]: next } as AppData;
    }
    case "SET_RUNNING_TIMER":
      return { ...state, runningTimer: action.timer };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "HYDRATE":
      return action.data;
    case "RESET":
      return createSeedData();
    default:
      return state;
  }
}

interface DataContextValue {
  data: AppData;
  dispatch: Dispatch<DataAction>;
  /** False during SSR/prerender and the first client render, before localStorage is read. */
  isHydrated: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(dataReducer, undefined, () =>
    createSeedData(),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: "HYDRATE", data: JSON.parse(raw) as AppData });
      }
    } catch {
      // ignore corrupt storage, keep seed data
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return (
    <DataContext.Provider value={{ data, dispatch, isHydrated }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
