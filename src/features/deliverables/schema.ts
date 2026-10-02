import * as z from "zod";

export const deliverableSchema = z
  .object({
    projectId: z.string().min(1, "required"),
    title: z.string().trim().min(1, "required").max(150, "maxLength"),
    dueDate: z.string().min(1, "required"),
    description: z.string().optional(),
    externalUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.externalUrl && data.externalUrl.trim()) {
      try {
        const url = new URL(data.externalUrl.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      } catch {
        ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "invalidUrl" });
      }
    }
  });

export type DeliverableFormValues = z.infer<typeof deliverableSchema>;
