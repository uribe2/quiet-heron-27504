"use client";

import { useState, type KeyboardEvent } from "react";
import { Send, MessageSquare, Sparkles, User, AlertTriangle } from "lucide-react";
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
      <h2 className="flex items-center gap-2 text-xl font-semibold text-text">
        <MessageSquare className="h-5 w-5 text-accent" aria-hidden="true" />
        {t("ai.askTitle")}
      </h2>

      <div className="flex flex-col gap-2">
        <p className="label-eyebrow">{t("ai.suggestedTitle")}</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((key) => (
            <Button key={key} variant="secondary" disabled={isLoading} onClick={() => void submit(t(key))}>
              {t(key)}
            </Button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {messages.length === 0 && !pending ? <p className="text-sm text-text-muted">{t("ai.emptyChat")}</p> : null}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
              {m.role === "user" ? (
                <User className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              )}
              {m.role === "user" ? t("ai.roleUser") : t("ai.roleAssistant")}
              {m.role === "assistant" ? <span>· {t("common.simulatedResponse")}</span> : null}
            </p>
            <div
              className={`max-w-[90%] rounded-xl border border-border p-3 text-sm text-text ${
                m.role === "user" ? "bg-surface-muted" : "bg-accent-soft"
              }`}
            >
              <p className="whitespace-pre-line leading-6">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {pending ? (
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs font-medium text-text-muted">{t("ai.roleUser")}</p>
          <div className="max-w-[90%] rounded-xl border border-border bg-surface-muted p-3 text-sm text-text">
            <p className="whitespace-pre-line leading-6">{pending}</p>
          </div>
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
        <div role="alert" className="flex flex-col items-start gap-2 rounded-lg bg-danger-soft p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{t("ai.askError")}</p>
          <Button variant="secondary" onClick={() => void handleRetry()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-2 border-t border-border pt-4"
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
