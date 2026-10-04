"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Clock, DollarSign } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { TimerCard } from "@/features/time/components/timer-card";
import { EntryFiltersBar } from "@/features/time/components/entry-filters-bar";
import { EntryList } from "@/features/time/components/entry-list";
import { EntryDrawer } from "@/features/time/components/entry-drawer";
import { useTimeEntries } from "@/features/time/use-time-entries";
import { filterEntries, formatDuration, groupEntriesByDay, summarize, weekRange, type TimeFilters } from "@/features/time/logic";
import type { TimeEntry } from "@/features/time/types";
import type { TimeEntryFormValues } from "@/features/time/schema";

function defaultFilters(): TimeFilters {
  return { ...weekRange(), billable: "all", invoiced: "all" };
}

export default function TimePage() {
  const { t, formatMoney } = useTranslation();
  const { show } = useToast();
  const { data } = useData();
  const { entries, createEntry, updateEntry, deleteEntry } = useTimeEntries();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<TimeEntry | undefined>(undefined);
  const [filters, setFilters] = useState<TimeFilters>(defaultFilters);

  const filtered = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  const groups = useMemo(() => groupEntriesByDay(filtered), [filtered]);
  const summary = useMemo(() => summarize(filtered, data.projects), [filtered, data.projects]);

  const selectableProjects = data.projects.filter(
    (p) => p.status === "active" || p.id === editing?.projectId,
  );

  function openCreate() {
    setEditing(undefined);
    drawer.open();
  }

  function openEdit(entry: TimeEntry) {
    setEditing(entry);
    drawer.open();
  }

  function handleSubmit(values: TimeEntryFormValues) {
    if (editing && !updateEntry(editing.id, values)) {
      show({ message: t("time.lockedToast") });
      return;
    }
    if (!editing) createEntry(values);
    show({ message: t("time.saveSuccess") });
    drawer.close();
  }

  const addButton = <Button onClick={openCreate}>{t("time.manualButton")}</Button>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("time.title")} actions={addButton} />
      <TimerCard />

      <EntryFiltersBar filters={filters} projects={data.projects} onChange={setFilters} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("time.summaryTotal")}
          value={formatDuration(summary.totalMinutes)}
          icon={<Clock className="h-5 w-5" aria-hidden="true" />}
        />
        <KpiCard
          label={t("time.summaryBillable")}
          value={formatDuration(summary.billableMinutes)}
          icon={<BadgeCheck className="h-5 w-5" aria-hidden="true" />}
        />
        <KpiCard
          label={t("time.summaryAmount")}
          value={formatMoney(summary.billableAmountCents)}
          icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" aria-hidden="true" />}
          title={t("time.emptyTitle")}
          description={t("time.emptyDescription")}
          action={addButton}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" aria-hidden="true" />}
          title={t("time.emptyFilteredTitle")}
          description={t("time.emptyFilteredDescription")}
          action={
            <Button variant="secondary" onClick={() => setFilters({ billable: "all", invoiced: "all" })}>
              {t("time.clearFilters")}
            </Button>
          }
        />
      ) : (
        <EntryList groups={groups} projects={data.projects} onEdit={openEdit} onDelete={deleteEntry} />
      )}

      <EntryDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        entry={editing}
        projects={selectableProjects}
        deliverables={data.deliverables}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
