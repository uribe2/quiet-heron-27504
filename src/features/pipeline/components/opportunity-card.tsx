"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { OPPORTUNITY_STAGES, type Opportunity, type OpportunityStage } from "../types";
import { adjacentStage, reasonLabelKey, stageLabelKey } from "../logic";

export interface OpportunityCardHandlers {
  onMove: (opportunity: Opportunity, stage: OpportunityStage) => void;
  onEdit: (opportunity: Opportunity) => void;
  onCreateQuote: (opportunity: Opportunity) => void;
  onWon: (opportunity: Opportunity) => void;
  onLost: (opportunity: Opportunity) => void;
  onReopen: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}

interface OpportunityCardProps extends OpportunityCardHandlers {
  opportunity: Opportunity;
  clientName: string;
}

export function OpportunityCard({
  opportunity: o,
  clientName,
  onMove,
  onEdit,
  onCreateQuote,
  onWon,
  onLost,
  onReopen,
  onDelete,
}: OpportunityCardProps) {
  const { t, formatMoney, formatDate } = useTranslation();
  const isOpen = o.status === "open";
  const prev = adjacentStage(o.stage, -1);
  const next = adjacentStage(o.stage, 1);
  const vars = { title: o.title };

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text">{o.title}</p>
        {!isOpen ? (
          <StatusBadge
            label={o.status === "won" ? t("pipeline.statusWon") : t("pipeline.statusLost")}
            tone={o.status === "won" ? "success" : "danger"}
          />
        ) : null}
      </div>
      <p className="text-xs text-text-muted">{clientName}</p>
      <p className="text-base font-semibold text-text">{formatMoney(o.estimatedValueCents)}</p>
      <p className="text-xs text-text-muted">
        {o.expectedCloseDate
          ? t("pipeline.expectedClose", { date: formatDate(o.expectedCloseDate) })
          : t("pipeline.noExpectedClose")}
      </p>
      {o.status === "lost" && o.lostReason ? (
        <p className="text-xs text-danger">
          {t("pipeline.lostReasonLabel", { reason: t(reasonLabelKey(o.lostReason)) })}
        </p>
      ) : null}

      {isOpen ? (
        <div className="flex items-center gap-1">
          <IconButton aria-label={t("pipeline.movePrev", vars)} disabled={!prev} onClick={() => prev && onMove(o, prev)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <Select
            aria-label={t("pipeline.moveToLabel", vars)}
            value=""
            onChange={(e) => e.target.value && onMove(o, e.target.value as OpportunityStage)}
            className="min-w-0 flex-1"
          >
            <option value="">{t("pipeline.moveTo")}</option>
            {OPPORTUNITY_STAGES.filter((s) => s !== o.stage).map((s) => (
              <option key={s} value={s}>
                {t(stageLabelKey(s))}
              </option>
            ))}
          </Select>
          <IconButton aria-label={t("pipeline.moveNext", vars)} disabled={!next} onClick={() => next && onMove(o, next)}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isOpen ? (
          <>
            <Button variant="secondary" aria-label={t("pipeline.createQuoteLabel", vars)} onClick={() => onCreateQuote(o)}>
              {t("pipeline.createQuoteAction")}
            </Button>
            <Button variant="secondary" onClick={() => onWon(o)}>
              {t("pipeline.markWon")}
            </Button>
            <Button variant="secondary" onClick={() => onLost(o)}>
              {t("pipeline.markLost")}
            </Button>
            <Button variant="link" aria-label={t("pipeline.editLabel", vars)} onClick={() => onEdit(o)}>
              {t("pipeline.editAction")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => onReopen(o)}>
            {t("pipeline.reopenAction")}
          </Button>
        )}
        <Button variant="destructive" aria-label={t("pipeline.deleteLabel", vars)} onClick={() => onDelete(o)}>
          {t("pipeline.deleteAction")}
        </Button>
      </div>
    </li>
  );
}
