"use client";

import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useProjects } from "@/features/projects/use-projects";
import { useClients } from "@/features/clients/use-clients";
import { filterProjects, type ProjectFilters } from "@/features/projects/logic";
import type { ProjectFormValues } from "@/features/projects/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFiltersBar } from "@/features/projects/components/project-filters-bar";
import { ProjectList } from "@/features/projects/components/project-list";
import { ProjectDrawer } from "@/features/projects/components/project-drawer";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { projects, createProject } = useProjects();
  const { clients } = useClients();
  const drawer = useDisclosure(false);
  const [filters, setFilters] = useState<ProjectFilters>({ status: "active" });

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);

  function handleSubmit(values: ProjectFormValues) {
    createProject(values);
    drawer.close();
  }

  return (
    <div>
      <PageHeader
        title={t("projects.title")}
        actions={<Button onClick={drawer.open}>{t("projects.createButton")}</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" aria-hidden="true" />}
          title={t("projects.emptyTitle")}
          description={t("projects.emptyDescription")}
          action={<Button onClick={drawer.open}>{t("projects.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ProjectFiltersBar filters={filters} clients={activeClients} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-8 w-8" aria-hidden="true" />}
              title={t("projects.emptyFilteredTitle")}
              description={t("projects.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({ status: "active" })}>
                  {t("projects.clearFilters")}
                </Button>
              }
            />
          ) : (
            <ProjectList projects={filtered} />
          )}
        </div>
      )}

      <ProjectDrawer isOpen={drawer.isOpen} onClose={drawer.close} clients={activeClients} onSubmit={handleSubmit} />
    </div>
  );
}
