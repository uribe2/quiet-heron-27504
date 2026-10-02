"use client";

import { useCallback, useRef, useState } from "react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import type { AppData } from "@/lib/app-data";
import {
  answerQuestion,
  draftFollowUp,
  generateSummary,
  DEFAULT_DELAY_MS,
  type DraftInput,
  type MockLang,
} from "./mock-ai";

export interface AIBackend {
  generateSummary: (data: AppData, periodDays: number, lang: MockLang, delayMs?: number) => Promise<string>;
  answerQuestion: (question: string, data: AppData, lang: MockLang, delayMs?: number) => Promise<string>;
  draftFollowUp: (input: DraftInput, data: AppData, lang: MockLang, delayMs?: number) => Promise<string>;
}

export interface UseAIOptions {
  /** Override any mock function (tests use this to simulate failures). */
  backend?: Partial<AIBackend>;
  delayMs?: number;
}

const defaultBackend: AIBackend = { generateSummary, answerQuestion, draftFollowUp };

/** Manages loading / error / result for one mocked AI call at a time. */
export function useAI(options: UseAIOptions = {}) {
  const { data } = useData();
  const { lang } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const lastCall = useRef<(() => Promise<string>) | null>(null);
  const requestId = useRef(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const dataRef = useRef(data);
  dataRef.current = data;

  const run = useCallback(async (call: () => Promise<string>): Promise<string | null> => {
    lastCall.current = call;
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const value = await call();
      if (id !== requestId.current) return null;
      setResult(value);
      return value;
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, []);

  const summarize = useCallback(
    (periodDays: number) =>
      run(() => {
        const o = optionsRef.current;
        return { ...defaultBackend, ...o.backend }.generateSummary(dataRef.current, periodDays, lang, o.delayMs ?? DEFAULT_DELAY_MS);
      }),
    [run, lang],
  );
  const ask = useCallback(
    (question: string) =>
      run(() => {
        const o = optionsRef.current;
        return { ...defaultBackend, ...o.backend }.answerQuestion(question, dataRef.current, lang, o.delayMs ?? DEFAULT_DELAY_MS);
      }),
    [run, lang],
  );
  const draft = useCallback(
    (input: DraftInput) =>
      run(() => {
        const o = optionsRef.current;
        return { ...defaultBackend, ...o.backend }.draftFollowUp(input, dataRef.current, lang, o.delayMs ?? DEFAULT_DELAY_MS);
      }),
    [run, lang],
  );

  const retry = useCallback(
    async (): Promise<string | null> => (lastCall.current ? run(lastCall.current) : null),
    [run],
  );

  const reset = () => {
    requestId.current++;
    setIsLoading(false);
    setError(null);
    setResult(null);
  };

  return { isLoading, error, result, ask, summarize, draft, retry, reset };
}
