"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildDocumentSchema, type DocumentFormValues } from "../schema";
import { fileNameWithoutExtension, formatFileSize, parseTags } from "../logic";
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_BYTES, type DocumentRecord } from "../types";
import { DOCUMENT_KINDS, kindLabelKey } from "./kind-meta";
import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";
import { useTranslation } from "@/context/i18n-context";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const DOCUMENT_FORM_ID = "document-form";

function toDefaults(doc?: DocumentRecord): DocumentFormValues {
  return {
    name: doc?.name ?? "",
    kind: doc?.kind ?? "other",
    clientId: doc?.clientId ?? "",
    projectId: doc?.projectId ?? "",
    sourceType: doc?.source.type ?? "link",
    url: doc?.source.type === "link" ? doc.source.url : "",
    file: doc?.source.type === "file" ? doc.source : undefined,
    tags: doc?.tags ?? [],
    description: doc?.description ?? "",
  };
}

const FILE_ERRORS = ["fileTooLarge", "fileTypeNotAllowed", "fileRequired"];
const MAX_MB = MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024);
const TYPES = ALLOWED_DOCUMENT_EXTENSIONS.join(", ");

interface DocumentFormProps {
  document?: DocumentRecord;
  clients: Client[];
  projects: Project[];
  onSubmit: (values: DocumentFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function DocumentForm({ document: doc, clients, projects, onSubmit, onDirtyChange }: DocumentFormProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(doc);
  const schema = useMemo(() => buildDocumentSchema(isEdit ? "edit" : "create"), [isEdit]);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<DocumentFormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(doc) });
  const sourceType = watch("sourceType");
  const file = watch("file");
  const [tagsText, setTagsText] = useState((doc?.tags ?? []).join(", "));

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function message(code?: string): string | undefined {
    if (!code) return undefined;
    if (FILE_ERRORS.includes(code)) return t(`documents.${code}`, { max: MAX_MB, types: TYPES });
    return t(`validation.${code}`);
  }

  function handleFile(selected: File | undefined) {
    if (!selected) {
      setValue("file", undefined, { shouldDirty: true, shouldValidate: true });
      return;
    }
    // Metadata only: the file content is never read in Cycle 1.
    setValue(
      "file",
      { fileName: selected.name, mimeType: selected.type, sizeBytes: selected.size },
      { shouldDirty: true, shouldValidate: true },
    );
    if (!getValues("name").trim()) {
      setValue("name", fileNameWithoutExtension(selected.name), { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <form id={DOCUMENT_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {isEdit ? null : (
        <FormSection title={t("documents.sectionSource")}>
          <FormField label={t("documents.fieldSourceType")} required>
            <Select {...register("sourceType")}>
              <option value="link">{t("documents.sourceLink")}</option>
              <option value="file">{t("documents.sourceFile")}</option>
            </Select>
          </FormField>
          {sourceType === "link" ? (
            <FormField label={t("documents.fieldUrl")} required error={message(errors.url?.message)}>
              <Input type="url" placeholder="https://" {...register("url")} />
            </FormField>
          ) : (
            <>
              <FormField
                label={t("documents.fieldFile")}
                required
                hint={t("documents.fileHint", { max: MAX_MB, types: TYPES })}
                error={message(errors.file?.message)}
              >
                <Input type="file" onChange={(e) => handleFile(e.target.files?.[0])} />
              </FormField>
              {file ? (
                <p className="text-xs text-text-muted">
                  {file.fileName} · {formatFileSize(file.sizeBytes)}
                </p>
              ) : null}
              <p className="rounded-lg border border-border bg-accent-soft p-3 text-xs text-text">{t("documents.storageNote")}</p>
            </>
          )}
        </FormSection>
      )}

      <FormSection title={t("documents.sectionDetails")}>
        <FormField label={t("documents.fieldName")} required error={message(errors.name?.message)}>
          <Input {...register("name")} />
        </FormField>
        <FormField label={t("documents.fieldKind")} required>
          <Select {...register("kind")}>
            {DOCUMENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(kindLabelKey(k))}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("documents.fieldClient")}>
            <Select {...register("clientId")}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("documents.fieldProject")}>
            <Select {...register("projectId")}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <FormField label={t("documents.fieldTags")} hint={t("documents.fieldTagsHint")}>
              <Input
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  field.onChange(parseTags(e.target.value));
                }}
              />
            </FormField>
          )}
        />
        <FormField label={t("documents.fieldDescription")} error={message(errors.description?.message)}>
          <Textarea rows={3} {...register("description")} />
        </FormField>
      </FormSection>
    </form>
  );
}
