"use client";

import { useMemo, useRef } from "react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { AIConversation, AIMessage } from "./types";

export const TITLE_MAX_LENGTH = 60;

export function makeTitle(question: string): string {
  const text = question.trim().replace(/\s+/g, " ");
  return text.length > TITLE_MAX_LENGTH ? text.slice(0, TITLE_MAX_LENGTH) : text;
}

/** Pinned first, then most recently updated. */
export function sortConversations(list: AIConversation[]): AIConversation[] {
  return [...list].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function useAIConversations() {
  const { data, dispatch } = useData();
  const { t } = useTranslation();
  const { deleteWithUndo } = useUndoableDelete();
  const latest = useRef(data.aiConversations);
  latest.current = data.aiConversations;

  const conversations = useMemo(() => sortConversations(data.aiConversations), [data.aiConversations]);

  function message(role: AIMessage["role"], content: string, kind?: AIMessage["kind"]): AIMessage {
    return { id: generateId(), role, content, kind, createdAt: getNowISO() };
  }

  /** Appends a user + assistant message; creates the conversation when `conversationId` is null. Returns its id. */
  function addExchange(conversationId: string | null, question: string, answer: string, clientId?: string): string {
    const messages = [message("user", question), message("assistant", answer, "answer")];
    const existing = conversationId ? latest.current.find((c) => c.id === conversationId) : undefined;
    if (existing) {
      dispatch({
        type: "UPDATE",
        collection: "aiConversations",
        id: existing.id,
        patch: { messages: [...existing.messages, ...messages] },
      });
      return existing.id;
    }
    const now = getNowISO();
    const conversation: AIConversation = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      title: makeTitle(question),
      clientId,
      messages,
      pinned: false,
    };
    dispatch({ type: "ADD", collection: "aiConversations", item: conversation });
    return conversation.id;
  }

  function renameConversation(id: string, title: string) {
    const clean = title.trim();
    if (!clean) return;
    dispatch({ type: "UPDATE", collection: "aiConversations", id, patch: { title: clean } });
  }

  function togglePin(conversation: AIConversation) {
    dispatch({ type: "UPDATE", collection: "aiConversations", id: conversation.id, patch: { pinned: !conversation.pinned } });
  }

  function deleteConversation(conversation: AIConversation) {
    const index = data.aiConversations.findIndex((c) => c.id === conversation.id);
    deleteWithUndo({
      item: conversation,
      message: t("ai.deletedToast"),
      onDelete: (c) => dispatch({ type: "REMOVE", collection: "aiConversations", id: c.id }),
      onRestore: (c) =>
        dispatch({
          type: "RESTORE",
          collection: "aiConversations",
          item: c,
          index: index < 0 ? latest.current.length : index,
        }),
    });
  }

  return { conversations, addExchange, renameConversation, togglePin, deleteConversation };
}
