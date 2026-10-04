"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useProjects } from "@/features/projects/use-projects";
import { useClients } from "@/features/clients/use-clients";
import { ProjectDrawer } from "@/features/projects/components/project-drawer";
import type { ProjectFormValues } from "@/features/projects/schema";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useData } from "@/context/data-context";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const mobileMenu = useDisclosure(false);
  const newProjectDrawer = useDisclosure(false);
  const { t } = useTranslation();
  const { show } = useToast();
  const router = useRouter();
  const { createProject } = useProjects();
  const { clients } = useClients();
  const { isHydrated } = useData();

  function handleCreateProject(values: ProjectFormValues) {
    const project = createProject(values);
    show({ message: t("projects.saveSuccess") });
    newProjectDrawer.close();
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-text focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {t("common.skipToContent")}
      </a>
      <Sidebar
        isOpen={mobileMenu.isOpen}
        onCloseMobile={mobileMenu.close}
        onNewProject={newProjectDrawer.open}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header onOpenMobileMenu={mobileMenu.open} />
        <main id="main-content" className="flex-1 px-4 py-8 lg:px-8">
          {/* Data lives in localStorage and depends on "today", so pages render only on
              the client; prerendered HTML would carry the build's date and time zone. */}
          <div className="mx-auto max-w-[1280px]">{isHydrated ? children : <PageSkeleton label={t("common.loading")} />}</div>
        </main>
      </div>
      <ProjectDrawer
        isOpen={newProjectDrawer.isOpen}
        onClose={newProjectDrawer.close}
        clients={clients.filter((c) => c.status === "active")}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
