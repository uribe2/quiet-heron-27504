"use client";

import { useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";
import { SummarySection } from "@/features/ai/components/summary-section";
import { ActionsSection } from "@/features/ai/components/actions-section";
import { ChatSection } from "@/features/ai/components/chat-section";
import { HistoryList } from "@/features/ai/components/history-list";
import { useAIConversations } from "@/features/ai/use-ai-conversations";

export default function AiPage() {
  const { t } = useTranslation();
  const { conversations, addExchange, renameConversation, togglePin, deleteConversation } = useAIConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("ai.title")} description={t("ai.description")} />
      <SummarySection />
      <ActionsSection />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ChatSection conversation={active} onExchange={(q, a) => setActiveId(addExchange(activeId, q, a))} />
        <HistoryList
          conversations={conversations}
          activeId={activeId}
          onOpen={setActiveId}
          onNew={() => setActiveId(null)}
          onRename={renameConversation}
          onTogglePin={togglePin}
          onDelete={(c) => {
            deleteConversation(c);
            if (c.id === activeId) setActiveId(null);
          }}
        />
      </div>
    </div>
  );
}
