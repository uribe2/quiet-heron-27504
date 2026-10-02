"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAI } from "../use-ai";
import type { AIConversation } from "../types";

const SUGGESTED = ["ai.suggestedOverdue", "ai.suggestedDeliverables", "ai.suggestedIncome", "ai.suggestedFollowUps", "ai.suggestedClient"];

interface Props {
  conversation: AIConversation | null;
  onExchange: (question: string, answer: string) => void;
}

export function ChatSection({ conversation, onExchange }: Props) {
  const { t } = useTranslation();
  const { ask, retry, isLoading, error } = useAI();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function submit(question: string) {
    const q = question.trim();
    if (!q || isLoading) return;
    setPending(q);
    setText("");
    const answer = await ask(q);
    if (answer !== null) {
      onExchange(q, answer);
      setPending(null);
    }
  }

  async function handleRetry() {
    const answer = await retry();
    if (answer !== null && pending) {
      onExchange(pending, answer);
      setPending(null);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit(text);
    }
  }

  const messages = conversation?.messages ?? [];

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("ai.askTitle")}</h2>

      <div aria-live="polite" className="flex flex-col gap-3">
        {messages.length === 0 && !pending ? <p className="text-sm text-text-muted">{t("ai.emptyChat")}</p> : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-bg text-text" : "border border-border bg-surface text-text"}`}
          >
            <p className="mb-1 text-xs font-medium text-text-muted">
              {m.role === "user" ? t("ai.roleUser") : t("ai.roleAssistant")}
            </p>
            <p className="whitespace-pre-line">{m.content}</p>
            {m.role === "assistant" ? <p className="mt-2 text-xs text-text-muted">{t("common.simulatedResponse")}</p> : null}
          </div>
        ))}
      </div>

      {pending ? (
        <div className="rounded-lg bg-bg p-3 text-sm text-text">
          <p className="mb-1 text-xs font-medium text-text-muted">{t("ai.roleUser")}</p>
          <p className="whitespace-pre-line">{pending}</p>
        </div>
      ) : null}
      {isLoading ? (
        <div className="flex flex-col gap-2" role="status">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <Spinner size={16} />
            {t("ai.thinking")}
          </span>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : null}
      {error && !isLoading ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm text-danger">
          <p>{t("ai.askError")}</p>
          <Button variant="secondary" onClick={() => void handleRetry()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-text-muted">{t("ai.suggestedTitle")}</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((key) => (
            <Button key={key} variant="secondary" disabled={isLoading} onClick={() => void submit(t(key))}>
              {t(key)}
            </Button>
          ))}
        </div>
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text);
        }}
      >
        <label htmlFor="ai-question" className="text-sm font-medium text-text">
          {t("ai.askLabel")}
        </label>
        <Textarea
          id="ai-question"
          rows={3}
          value={text}
          placeholder={t("ai.askPlaceholder")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div>
          <Button type="submit" disabled={isLoading || text.trim() === ""}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("ai.send")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
