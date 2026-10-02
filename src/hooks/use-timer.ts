"use client";

import { useEffect, useState } from "react";
import type { ISODateTime } from "@/lib/types";

/** Ticking elapsed milliseconds since startedAt; 0 when not running. */
export function useTimer(startedAt: ISODateTime | null): number {
  const [elapsedMs, setElapsedMs] = useState(0);

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
