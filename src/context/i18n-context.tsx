"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { es } from "@/i18n/es";
import { en } from "@/i18n/en";
import { useData } from "./data-context";
import { formatCents, formatDateISO } from "@/lib/format";

export type Lang = "es" | "en";
type Dict = typeof es;

const dictionaries: Record<Lang, Dict> = { es, en };
const locales: Record<Lang, string> = { es: "es-CO", en: "en-US" };
const STORAGE_KEY = "clientbrain:lang";

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

interface I18nContextValue {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
  formatMoney: (cents: number) => string;
  formatDate: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, maxDecimals?: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data } = useData();
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = getByPath(dictionaries[lang], key);
      return typeof value === "string" ? interpolate(value, vars) : key;
    },
    [lang],
  );

  const formatMoney = useCallback(
    (cents: number) => formatCents(cents, data.settings.currency, locales[lang]),
    [lang, data.settings.currency],
  );

  const formatDate = useCallback(
    (date: string, options?: Intl.DateTimeFormatOptions) =>
      formatDateISO(date, locales[lang], options),
    [lang],
  );

  const formatNumber = useCallback(
    (value: number, maxDecimals = 1) =>
      new Intl.NumberFormat(locales[lang], { maximumFractionDigits: maxDecimals }).format(value),
    [lang],
  );

  return (
    <I18nContext.Provider value={{ t, lang, setLang, formatMoney, formatDate, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
