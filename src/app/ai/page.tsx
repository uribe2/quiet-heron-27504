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
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
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
        <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
          <SummarySection />
          <ChatSection conversation={active} onExchange={(q, a) => setActiveId(addExchange(activeId, q, a))} />
          <ActionsSection />
        </div>
      </div>
    </div>
  );
}
