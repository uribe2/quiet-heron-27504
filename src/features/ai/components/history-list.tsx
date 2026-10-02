"use client";

import { useState } from "react";
import { Pin, PinOff, Pencil, Trash2, Plus } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { AIConversation } from "../types";

interface Props {
  conversations: AIConversation[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (conversation: AIConversation) => void;
  onDelete: (conversation: AIConversation) => void;
}

export function HistoryList({ conversations, activeId, onOpen, onNew, onRename, onTogglePin, onDelete }: Props) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  function startRename(c: AIConversation) {
    setEditingId(c.id);
    setDraftTitle(c.title);
  }

  function commitRename(id: string) {
    onRename(id, draftTitle);
    setEditingId(null);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text">{t("ai.historyTitle")}</h2>
        <Button variant="secondary" onClick={onNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("ai.newConversation")}
        </Button>
      </div>
      {conversations.length === 0 ? (
        <p className="text-sm text-text-muted">{t("ai.noConversations")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {conversations.map((c) => (
            <li
              key={c.id}
              className={`flex items-center gap-1 rounded-lg px-2 ${c.id === activeId ? "bg-accent-soft" : ""}`}
            >
              {editingId === c.id ? (
                <Input
                  ref={(el) => el?.focus()}
                  aria-label={t("ai.renameLabel")}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => commitRename(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onOpen(c.id)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className="min-h-11 flex-1 truncate text-left text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {c.pinned ? <span className="mr-1 text-xs text-text-muted">{t("ai.pinnedLabel")} ·</span> : null}
                  {c.title}
                </button>
              )}
              <IconButton aria-label={t("ai.rename")} onClick={() => startRename(c)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label={c.pinned ? t("ai.unpin") : t("ai.pin")} onClick={() => onTogglePin(c)}>
                {c.pinned ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
              </IconButton>
              <IconButton aria-label={t("ai.deleteConversation")} onClick={() => onDelete(c)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
