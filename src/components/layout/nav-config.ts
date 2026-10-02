import type { LucideIcon } from "lucide-react";
import {
  Users,
  MessageSquare,
  Columns3,
  Briefcase,
  ListChecks,
  Clock,
  FileText,
  Receipt,
  Wallet,
  Calendar,
  FolderOpen,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    labelKey: "nav.groupRelationship",
    items: [
      { href: "/clients", labelKey: "nav.clients", icon: Users },
      { href: "/interactions", labelKey: "nav.interactions", icon: MessageSquare },
      { href: "/pipeline", labelKey: "nav.pipeline", icon: Columns3 },
    ],
  },
  {
    labelKey: "nav.groupExecution",
    items: [
      { href: "/projects", labelKey: "nav.projects", icon: Briefcase },
      { href: "/deliverables", labelKey: "nav.deliverables", icon: ListChecks },
      { href: "/time", labelKey: "nav.time", icon: Clock },
    ],
  },
  {
    labelKey: "nav.groupClosing",
    items: [
      { href: "/quotes", labelKey: "nav.quotes", icon: FileText },
      { href: "/invoices", labelKey: "nav.invoices", icon: Receipt },
      { href: "/payments", labelKey: "nav.payments", icon: Wallet },
    ],
  },
  {
    labelKey: "nav.groupOrganization",
    items: [
      { href: "/meetings", labelKey: "nav.meetings", icon: Calendar },
      { href: "/documents", labelKey: "nav.documents", icon: FolderOpen },
    ],
  },
  {
    labelKey: "nav.groupIntelligence",
    items: [{ href: "/ai", labelKey: "nav.ai", icon: Sparkles }],
  },
];
