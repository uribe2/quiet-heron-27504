"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useMeetings } from "@/features/meetings/use-meetings";
import { useClients } from "@/features/clients/use-clients";
import { useProjects } from "@/features/projects/use-projects";
import { filterMeetings, getFocusTargetAfterDelete, isUpcoming, type MeetingFilters } from "@/features/meetings/logic";
import { getNowISO } from "@/lib/dates";
import type { Meeting } from "@/features/meetings/types";
import type { MeetingFormValues } from "@/features/meetings/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { MeetingFiltersBar } from "@/features/meetings/components/meeting-filters-bar";
import { MeetingList } from "@/features/meetings/components/meeting-list";
import { MeetingDrawer } from "@/features/meetings/components/meeting-drawer";

export default function MeetingsPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { meetings, createMeeting, updateMeeting, cancelMeeting, markDone, deleteMeeting } = useMeetings();
  const { clients } = useClients();
  const { projects } = useProjects();
  const drawer = useDisclosure(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined);
  const [tab, setTab] = useState("upcoming");
  const [filters, setFilters] = useState<MeetingFilters>({});

  const [pendingFocus, setPendingFocus] = useState<{ id: string | null } | null>(null);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const now = getNowISO();
  const byTab = useMemo(
    () => meetings.filter((m) => (tab === "upcoming" ? isUpcoming(m, now) : !isUpcoming(m, now))),
    [meetings, tab, now],
  );
  const filtered = useMemo(() => filterMeetings(byTab, filters), [byTab, filters]);

  // HU-10.4: after a deletion move focus to the next/previous item, or to the page heading.
  useEffect(() => {
    if (!pendingFocus) return;
    const timer = window.setTimeout(() => {
      const target = pendingFocus.id
        ? document.querySelector<HTMLElement>(`[data-meeting-id="${pendingFocus.id}"]`)
        : null;
      if (target) {
        target.focus();
      } else {
        const heading = document.querySelector<HTMLElement>("h1");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus();
      }
      setPendingFocus(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingFocus]);

  function openCreate() {
    setEditingMeeting(undefined);
    drawer.open();
  }

  function openMeeting(meeting: Meeting) {
    setEditingMeeting(meeting);
    drawer.open();
  }

  function handleSubmit(values: MeetingFormValues) {
    if (editingMeeting) {
      updateMeeting(editingMeeting.id, values);
    } else {
      createMeeting(values);
    }
    show({ message: t("meetings.saveSuccess") });
    drawer.close();
  }

  return (
    <div>
      <PageHeader title={t("meetings.title")} actions={<Button onClick={openCreate}>{t("meetings.createButton")}</Button>} />

      {meetings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" aria-hidden="true" />}
          title={t("meetings.emptyTitle")}
          description={t("meetings.emptyDescription")}
          action={<Button onClick={openCreate}>{t("meetings.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "upcoming", label: t("meetings.tabUpcoming") },
              { value: "past", label: t("meetings.tabPast") },
            ]}
          />
          <MeetingFiltersBar filters={filters} clients={activeClients} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" aria-hidden="true" />}
              title={t("meetings.emptyFilteredTitle")}
              description={t("meetings.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({})}>
                  {t("meetings.clearFilters")}
                </Button>
              }
            />
          ) : (
            <MeetingList meetings={filtered} onOpen={openMeeting} />
          )}
        </div>
      )}

      <MeetingDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        meeting={editingMeeting}
        clients={activeClients}
        projects={projects}
        onSubmit={handleSubmit}
        onCancelMeeting={(m) => {
          cancelMeeting(m);
          show({ message: t("meetings.cancelledToast") });
          drawer.close();
        }}
        onMarkDone={(m, notes, registerInteraction) => {
          markDone(m, notes, registerInteraction);
          show({ message: t("meetings.doneToast") });
        }}
        onDeleteRequest={(m) => {
          setPendingFocus({ id: getFocusTargetAfterDelete(filtered, m.id) });
          deleteMeeting(m);
          drawer.close();
        }}
      />
    </div>
  );
}
