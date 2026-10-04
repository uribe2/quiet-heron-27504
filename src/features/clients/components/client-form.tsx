"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { buildClientSchema, type ClientFormValues } from "../schema";
import type { Client } from "../types";
import { useTranslation } from "@/context/i18n-context";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { generateId } from "@/lib/ids";

export const CLIENT_FORM_ID = "client-form";

function clientToDefaults(client?: Client): ClientFormValues {
  return {
    name: client?.name ?? "",
    type: client?.type ?? "company",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    website: client?.website ?? "",
    taxId: client?.taxId ?? "",
    city: client?.city ?? "",
    country: client?.country ?? "",
    contacts: client?.contacts ?? [],
    tags: client?.tags ?? [],
    source: client?.source,
    notes: client?.notes ?? "",
  };
}

interface ClientFormProps {
  client?: Client;
  existingClients: Client[];
  onSubmit: (values: ClientFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ClientForm({ client, existingClients, onSubmit, onDirtyChange }: ClientFormProps) {
  const { t } = useTranslation();
  const schema = buildClientSchema(existingClients, client?.id);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: clientToDefaults(client),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const contactsError = (errors.contacts as { message?: string } | undefined)?.message;

  return (
    <form id={CLIENT_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("clients.sectionGeneral")}>
        <FormField label={t("clients.fieldName")} required error={errors.name?.message && t(`validation.${errors.name.message}`, { min: 2, max: 100 })}>
          <Input {...register("name")} />
        </FormField>
        <FormField label={t("clients.fieldType")} required>
          <Select {...register("type")}>
            <option value="company">{t("clients.typeCompany")}</option>
            <option value="individual">{t("clients.typeIndividual")}</option>
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("clients.fieldCity")}>
            <Input {...register("city")} />
          </FormField>
          <FormField label={t("clients.fieldCountry")}>
            <Input {...register("country")} />
          </FormField>
        </div>
        <FormField label={t("clients.fieldTaxId")}>
          <Input {...register("taxId")} />
        </FormField>
      </FormSection>

      <FormSection title={t("clients.sectionContact")}>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t("clients.fieldEmail")}
            error={errors.email?.message && t(`validation.${errors.email.message}`)}
          >
            <Input type="email" {...register("email")} />
          </FormField>
          <FormField label={t("clients.fieldPhone")}>
            <Input {...register("phone")} />
          </FormField>
        </div>
        <FormField
          label={t("clients.fieldWebsite")}
          error={errors.website?.message && t(`validation.${errors.website.message}`)}
        >
          <Input {...register("website")} />
        </FormField>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">{t("clients.contactsTitle")}</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({ id: generateId(), name: "", role: "", email: "", phone: "", isPrimary: fields.length === 0 })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("clients.addContact")}
            </Button>
          </div>
          {contactsError ? (
            <p className="text-xs text-danger">{t(`validation.${contactsError}`)}</p>
          ) : null}
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t("clients.contactName")} required>
                  <Input {...register(`contacts.${index}.name`)} />
                </FormField>
                <FormField label={t("clients.contactRole")}>
                  <Input {...register(`contacts.${index}.role`)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t("clients.contactEmail")}>
                  <Input type="email" {...register(`contacts.${index}.email`)} />
                </FormField>
                <FormField label={t("clients.contactPhone")}>
                  <Input {...register(`contacts.${index}.phone`)} />
                </FormField>
              </div>
              <div className="flex items-center justify-between">
                <Checkbox label={t("clients.contactPrimary")} {...register(`contacts.${index}.isPrimary`)} />
                <IconButton aria-label={t("clients.removeContact")} onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title={t("clients.sectionTagsNotes")}>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <FormField label={t("clients.fieldTags")} hint={t("clients.fieldTagsHint")}>
              <Input
                value={field.value.join(", ")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
              />
            </FormField>
          )}
        />
        <FormField label={t("clients.fieldSource")}>
          <Select {...register("source", { setValueAs: (v) => v || undefined })}>
            <option value="">—</option>
            <option value="referral">{t("clients.sourceReferral")}</option>
            <option value="website">{t("clients.sourceWebsite")}</option>
            <option value="social">{t("clients.sourceSocial")}</option>
            <option value="marketplace">{t("clients.sourceMarketplace")}</option>
            <option value="other">{t("clients.sourceOther")}</option>
          </Select>
        </FormField>
        <FormField label={t("clients.fieldNotes")}>
          <Textarea rows={3} {...register("notes")} />
        </FormField>
      </FormSection>
    </form>
  );
}
