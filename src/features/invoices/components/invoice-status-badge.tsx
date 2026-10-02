"use client";

import { Ban, ChartPie, CircleCheck, Pencil, Send, TriangleAlert, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { InvoiceDisplayStatus } from "../types";

const config: Record<
  InvoiceDisplayStatus,
  { key: "invoices.statusDraft" | "invoices.statusSent" | "invoices.statusPaid" | "invoices.statusCancelled" | "invoices.statusOverdue" | "invoices.statusPartiallyPaid"; tone: StatusTone; Icon: LucideIcon }
> = {
  draft: { key: "invoices.statusDraft", tone: "neutral", Icon: Pencil },
  sent: { key: "invoices.statusSent", tone: "accent", Icon: Send },
  paid: { key: "invoices.statusPaid", tone: "success", Icon: CircleCheck },
  cancelled: { key: "invoices.statusCancelled", tone: "neutral", Icon: Ban },
  overdue: { key: "invoices.statusOverdue", tone: "danger", Icon: TriangleAlert },
  partially_paid: { key: "invoices.statusPartiallyPaid", tone: "warning", Icon: ChartPie },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceDisplayStatus }) {
  const { t } = useTranslation();
  const { key, tone, Icon } = config[status];
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
      <StatusBadge label={t(key)} tone={tone} />
    </span>
  );
}
