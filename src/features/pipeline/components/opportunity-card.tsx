"use client";

import { ArrowLeft, ArrowRight, FilePlus2, Pencil, Trash2, Trophy, XCircle } from "lucide-react";
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
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-level-1)]">
      <p className="label-eyebrow !text-accent">{clientName}</p>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text">{o.title}</p>
        {!isOpen ? (
          <StatusBadge
            label={o.status === "won" ? t("pipeline.statusWon") : t("pipeline.statusLost")}
            tone={o.status === "won" ? "success" : "danger"}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-lg font-semibold text-text">{formatMoney(o.estimatedValueCents)}</p>
        <p className="text-xs text-text-muted">
        {o.expectedCloseDate
          ? t("pipeline.expectedClose", { date: formatDate(o.expectedCloseDate) })
          : t("pipeline.noExpectedClose")}
        </p>
      </div>
      {o.status === "lost" && o.lostReason ? (
        <p className="text-xs text-danger">
          {t("pipeline.lostReasonLabel", { reason: t(reasonLabelKey(o.lostReason)) })}
        </p>
      ) : null}

      {isOpen ? (
        <>
          <Select
            aria-label={t("pipeline.moveToLabel", vars)}
            value=""
            onChange={(e) => e.target.value && onMove(o, e.target.value as OpportunityStage)}
            className="w-full"
          >
            <option value="">{t("pipeline.moveTo")}</option>
            {OPPORTUNITY_STAGES.filter((s) => s !== o.stage).map((s) => (
              <option key={s} value={s}>
                {t(stageLabelKey(s))}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            className="w-full"
            aria-label={t("pipeline.createQuoteLabel", vars)}
            onClick={() => onCreateQuote(o)}
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            {t("pipeline.createQuoteAction")}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="px-2 text-success"
              aria-label={t("pipeline.markWonLabel", vars)}
              onClick={() => onWon(o)}
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              {t("pipeline.wonShort")}
            </Button>
            <Button
              variant="secondary"
              className="px-2 text-danger"
              aria-label={t("pipeline.markLostLabel", vars)}
              onClick={() => onLost(o)}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t("pipeline.lostShort")}
            </Button>
          </div>
        </>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => onReopen(o)}>
          {t("pipeline.reopenAction")}
        </Button>
      )}

      <div className="-mx-1 flex items-center border-t border-border pt-2">
        {isOpen ? (
          <>
            <IconButton aria-label={t("pipeline.movePrev", vars)} disabled={!prev} onClick={() => prev && onMove(o, prev)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <IconButton aria-label={t("pipeline.moveNext", vars)} disabled={!next} onClick={() => next && onMove(o, next)}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </>
        ) : null}
        <div className="flex-1" />
        {isOpen ? (
          <IconButton aria-label={t("pipeline.editLabel", vars)} onClick={() => onEdit(o)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        ) : null}
        <IconButton
          aria-label={t("pipeline.deleteLabel", vars)}
          onClick={() => onDelete(o)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </li>
  );
}
