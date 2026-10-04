"use client";

import { useEffect, useState } from "react";
import type { ISODateTime } from "@/lib/types";

/** Ticking elapsed milliseconds since startedAt; 0 when not running. */
export function useTimer(startedAt: ISODateTime | null): number {
  const [elapsedMs, setElapsedMs] = useState(() => elapsedSince(startedAt));
  // When the timer appears (e.g. after hydrating from localStorage) sync during render,
  // so the widget never paints a stale 00:00:00 frame before the effect runs.
  const [trackedStart, setTrackedStart] = useState(startedAt);
  if (trackedStart !== startedAt) {
    setTrackedStart(startedAt);
    setElapsedMs(elapsedSince(startedAt));
  }

  useEffect(() => {
    if (!startedAt) {
      setElapsedMs(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    setElapsedMs(Date.now() - start);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedMs;
}

function elapsedSince(startedAt: ISODateTime | null): number {
  return startedAt ? Date.now() - new Date(startedAt).getTime() : 0;
}
