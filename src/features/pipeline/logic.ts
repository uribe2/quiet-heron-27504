import { OPPORTUNITY_STAGES, type Opportunity, type OpportunityStage } from "./types";

export interface PipelineFilters {
  clientId?: string;
  showClosed?: boolean;
}

export type PipelineColumns = Record<OpportunityStage, Opportunity[]>;
export type ColumnTotals = Record<OpportunityStage, { count: number; totalCents: number }>;

/** Groups opportunities by stage, ordered by position. Open only unless showClosed. */
export function getColumns(opportunities: Opportunity[], filters: PipelineFilters = {}): PipelineColumns {
  const columns = {} as PipelineColumns;
  for (const stage of OPPORTUNITY_STAGES) columns[stage] = [];
  for (const opp of opportunities) {
    if (!filters.showClosed && opp.status !== "open") continue;
    if (filters.clientId && opp.clientId !== filters.clientId) continue;
    columns[opp.stage].push(opp);
  }
  for (const stage of OPPORTUNITY_STAGES) columns[stage].sort((a, b) => a.position - b.position);
  return columns;
}

export function columnTotals(columns: PipelineColumns): ColumnTotals {
  const totals = {} as ColumnTotals;
  for (const stage of OPPORTUNITY_STAGES) {
    totals[stage] = {
      count: columns[stage].length,
      totalCents: columns[stage].reduce((sum, o) => sum + o.estimatedValueCents, 0),
    };
  }
  return totals;
}

/** Position at the end of a column (open opportunities only). */
export function nextPosition(opportunities: Opportunity[], stage: OpportunityStage, excludeId?: string): number {
  const positions = opportunities
    .filter((o) => o.stage === stage && o.status === "open" && o.id !== excludeId)
    .map((o) => o.position);
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}

/** Patch to move an opportunity to the end of another stage. */
export function moveToStage(
  opportunities: Opportunity[],
  id: string,
  stage: OpportunityStage,
): Pick<Opportunity, "stage" | "position"> {
  return { stage, position: nextPosition(opportunities, stage, id) };
}

export function adjacentStage(stage: OpportunityStage, direction: -1 | 1): OpportunityStage | undefined {
  return OPPORTUNITY_STAGES[OPPORTUNITY_STAGES.indexOf(stage) + direction];
}

export function stageLabelKey(stage: OpportunityStage): string {
  return `pipeline.stage${stage.charAt(0).toUpperCase()}${stage.slice(1)}`;
}

export function reasonLabelKey(reason: string): string {
  const map: Record<string, string> = {
    price: "reasonPrice",
    timing: "reasonTiming",
    scope: "reasonScope",
    no_response: "reasonNoResponse",
    other: "reasonOther",
  };
  return `pipeline.${map[reason] ?? "reasonOther"}`;
}
