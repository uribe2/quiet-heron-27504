import { es } from "@/i18n/es";
import { en } from "@/i18n/en";
import { addDays, diffInDays, getToday } from "@/lib/dates";
import { formatCents, formatDateISO } from "@/lib/format";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import { getDueFollowUps, getPendingFollowUps } from "@/features/interactions/logic";
import { groupDeliverablesByDue } from "@/features/deliverables/logic";
import type { AppData } from "@/lib/app-data";
import type { InteractionChannel } from "@/features/interactions/types";
import { getClientHealth, getOverdueDeliverablesForClient, getOverdueInvoicesForClient } from "./logic";

export type MockLang = "es" | "en";
export type DraftChannel = Extract<InteractionChannel, "email" | "whatsapp">;
export type DraftTone = "formal" | "friendly";

export interface DraftInput {
  clientId: string;
  channel: DraftChannel;
  tone: DraftTone;
  goal: string;
}

export const DEFAULT_DELAY_MS = 1500;

const dictionaries = { es, en };
const locales: Record<MockLang, string> = { es: "es-CO", en: "en-US" };

type Vars = Record<string, string | number>;

function makeText(lang: MockLang) {
  const mock = dictionaries[lang].ai.mock as Record<string, string>;
  return (key: string, vars?: Vars): string => {
    const template = mock[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (m, k: string) => (vars && k in vars ? String(vars[k]) : m));
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function context(data: AppData, lang: MockLang) {
  const text = makeText(lang);
  const money = (cents: number) => formatCents(cents, data.settings.currency, locales[lang]);
  const date = (d: string) => formatDateISO(d, locales[lang]);
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "";
  const healthLabel = (label: string) =>
    dictionaries[lang].ai[`health${label[0].toUpperCase()}${label.slice(1)}` as "healthHealthy"];
  return { text, money, date, clientName, healthLabel };
}

function overdueInvoices(data: AppData, today: string) {
  return data.invoices.filter((i) => getInvoiceFinancials(i, data.payments, today).displayStatus === "overdue");
}

export async function generateSummary(
  data: AppData,
  periodDays: number,
  lang: MockLang,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string> {
  await wait(delayMs);
  const { text, money, healthLabel } = context(data, lang);
  const today = getToday();
  const since = addDays(today, -periodDays);
  const payments = data.payments.filter((p) => p.date >= since && p.date <= today);
  const overdue = overdueInvoices(data, today);
  const receivable = data.invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + getInvoiceFinancials(i, data.payments, today).balanceCents, 0);
  const groups = groupDeliverablesByDue(data.deliverables, today);
  const attention = data.clients
    .filter((c) => c.status === "active")
    .map((c) => ({ c, h: getClientHealth(c.id, data, today) }))
    .filter(({ h }) => h.label !== "healthy");

  return [
    text("summaryHeader", { days: periodDays, name: data.settings.userName }),
    text("summaryIncome", { amount: money(payments.reduce((s, p) => s + p.amountCents, 0)), count: payments.length }),
    text("summaryReceivable", { amount: money(receivable), overdue: overdue.length }),
    text("summaryDeliverables", { overdue: groups.overdue.length, soon: groups.today.length + groups.tomorrow.length }),
    text("summaryFollowUps", { count: getDueFollowUps(data.interactions, today).length }),
    text("summaryProjects", { count: data.projects.filter((p) => p.status === "active").length }),
    attention.length > 0
      ? text("summaryAttention", {
          names: attention.map(({ c, h }) => `${c.name} (${healthLabel(h.label)} ${h.score}%)`).join(", "),
        })
      : text("summaryAllGood"),
  ].join("\n");
}

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

export async function answerQuestion(
  question: string,
  data: AppData,
  lang: MockLang,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string> {
  await wait(delayMs);
  const { text, money, date, clientName, healthLabel } = context(data, lang);
  const today = getToday();
  const q = question.toLowerCase();

  if (has(q, ["vencid", "overdue", "unpaid"])) {
    const list = overdueInvoices(data, today);
    if (list.length === 0) return text("overdueNone");
    return [
      text("overdueHeader", { count: list.length }),
      ...list.map((i) =>
        text("overdueItem", {
          number: i.number,
          client: clientName(i.clientId),
          amount: money(getInvoiceFinancials(i, data.payments, today).balanceCents),
          days: diffInDays(today, i.dueDate),
        }),
      ),
    ].join("\n");
  }

  if (has(q, ["entregable", "deliverable", "milestone", "hito"])) {
    const g = groupDeliverablesByDue(data.deliverables, today);
    const list = [...g.overdue, ...g.today, ...g.tomorrow, ...g.thisWeek];
    if (list.length === 0) return text("deliverablesNone");
    return [
      text("deliverablesHeader", { count: list.length }),
      ...list.map((d) =>
        text("deliverablesItem", {
          title: d.title,
          project: data.projects.find((p) => p.id === d.projectId)?.name ?? "",
          date: date(d.dueDate),
        }),
      ),
    ].join("\n");
  }

  if (has(q, ["ingreso", "income", "revenue", "cobrad", "collected", "earned"])) {
    const month = today.slice(0, 7);
    const payments = data.payments.filter((p) => p.date.startsWith(month));
    return text("incomeAnswer", { amount: money(payments.reduce((s, p) => s + p.amountCents, 0)), count: payments.length });
  }

  if (has(q, ["seguimiento", "follow-up", "follow up", "followup"])) {
    const list = getPendingFollowUps(data.interactions);
    if (list.length === 0) return text("followUpsNone");
    return [
      text("followUpsHeader", { count: list.length }),
      ...list.map((i) =>
        text("followUpsItem", { client: clientName(i.clientId), summary: i.summary, date: date(i.followUpDate as string) }),
      ),
    ].join("\n");
  }

  const client = data.clients.find((c) => q.includes(c.name.toLowerCase()));
  if (client) {
    const h = getClientHealth(client.id, data, today);
    return [
      text("clientAnswer", { client: client.name, label: healthLabel(h.label), score: h.score }),
      text("clientOverdue", { count: getOverdueInvoicesForClient(client.id, data, today).length }),
      text("clientDeliverables", { count: getOverdueDeliverablesForClient(client.id, data, today).length }),
    ].join(" ");
  }

  return text("fallback");
}

export async function draftFollowUp(
  input: DraftInput,
  data: AppData,
  lang: MockLang,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string> {
  await wait(delayMs);
  const { text } = context(data, lang);
  const client = data.clients.find((c) => c.id === input.clientId);
  const contact = client?.contacts.find((c) => c.isPrimary)?.name ?? client?.name ?? "";
  const rawGoal = input.goal.trim() || text("draftNoGoal");
  const goal = /[.!?]$/.test(rawGoal) ? rawGoal : `${rawGoal}.`;
  const key = `draft${input.channel === "email" ? "Email" : "Whatsapp"}${input.tone === "formal" ? "Formal" : "Friendly"}`;
  return text(key, { contact, goal, user: data.settings.userName, business: data.settings.businessName });
}
