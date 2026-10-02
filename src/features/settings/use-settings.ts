"use client";

import { useCallback } from "react";
import { useData } from "@/context/data-context";
import type { SettingsFormValues } from "./schema";

export function useSettings() {
  const { data, dispatch } = useData();

  const updateSettings = useCallback(
    (values: SettingsFormValues) => {
      dispatch({ type: "UPDATE_SETTINGS", patch: values });
    },
    [dispatch],
  );

  const resetDemoData = useCallback(() => {
    dispatch({ type: "RESET" });
  }, [dispatch]);

  return { settings: data.settings, updateSettings, resetDemoData };
}
