"use client";

import { useToast } from "@/context/toast-context";
import { useTranslation } from "@/context/i18n-context";

interface UndoableDeleteOptions<T> {
  item: T;
  message: string;
  onDelete: (item: T) => void;
  onRestore: (item: T) => void;
}

export interface UndoableDelete {
  deleteWithUndo: <T>(options: UndoableDeleteOptions<T>) => void;
}

/** Deletes immediately and offers an 8s "Deshacer" toast to restore. */
export function useUndoableDelete(): UndoableDelete {
  const { show } = useToast();
  const { t } = useTranslation();

  function deleteWithUndo<T>({ item, message, onDelete, onRestore }: UndoableDeleteOptions<T>) {
    onDelete(item);
    show({
      message,
      actionLabel: t("common.undo"),
      onAction: () => onRestore(item),
    });
  }

  return { deleteWithUndo };
}
