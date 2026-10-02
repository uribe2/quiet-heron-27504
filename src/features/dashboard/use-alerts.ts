"use client";

import { useMemo } from "react";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { getAlerts, type DashboardAlert } from "./alerts";

export function useAlerts(): DashboardAlert[] {
  const { data } = useData();
  return useMemo(() => getAlerts(data, getToday()), [data]);
}
