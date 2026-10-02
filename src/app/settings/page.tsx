"use client";

import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { PageHeader } from "@/components/ui/page-header";
import { useSettings } from "@/features/settings/use-settings";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { ResetDataSection } from "@/features/settings/components/reset-data-section";

export default function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { settings, updateSettings, resetDemoData } = useSettings();
  // Remount the form with fresh defaults whenever stored settings change (e.g. after a reset).
  const formKey = JSON.stringify(settings);

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="flex flex-col gap-8">
        <SettingsForm
          key={formKey}
          settings={settings}
          onSubmit={(values) => {
            updateSettings(values);
            toast.show({ message: t("settings.saveSuccess") });
          }}
        />
        <ResetDataSection
          onReset={() => {
            resetDemoData();
            toast.show({ message: t("settings.resetSuccess") });
          }}
        />
      </div>
    </div>
  );
}
