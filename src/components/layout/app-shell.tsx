"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useTranslation } from "@/context/i18n-context";
import { useProjects } from "@/features/projects/use-projects";
import { useClients } from "@/features/clients/use-clients";
import { ProjectDrawer } from "@/features/projects/components/project-drawer";
import type { ProjectFormValues } from "@/features/projects/schema";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: ReactNode }) {
  const mobileMenu = useDisclosure(false);
  const newProjectDrawer = useDisclosure(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { createProject } = useProjects();
  const { clients } = useClients();

  function handleCreateProject(values: ProjectFormValues) {
    const project = createProject(values);
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
      <div className="flex min-h-screen flex-1 flex-col">
        <Header onOpenMobileMenu={mobileMenu.open} />
        <main id="main-content" className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">{children}</div>
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
