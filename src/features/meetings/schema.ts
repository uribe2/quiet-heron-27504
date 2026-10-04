import * as z from "zod";

export const MEETING_TITLE_MAX = 150;

const baseMeetingSchema = z.object({
  title: z.string().trim().min(1, "required").max(MEETING_TITLE_MAX, "maxLength"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  startsAt: z.string().min(1, "required"),
  durationMinutes: z
    .number({ error: "durationRange" })
    .min(15, "durationRange")
    .max(480, "durationRange"),
  mode: z.enum(["in_person", "video", "call"]),
  locationOrLink: z.string().optional(),
  agenda: z.string().optional(),
});

export function buildMeetingSchema(requireFutureStart: boolean) {
  return baseMeetingSchema.superRefine((data, ctx) => {
    if (data.mode === "video") {
      if (!data.locationOrLink) {
        ctx.addIssue({ code: "custom", path: ["locationOrLink"], message: "required" });
      } else {
        try {
          new URL(data.locationOrLink);
        } catch {
          ctx.addIssue({ code: "custom", path: ["locationOrLink"], message: "invalidUrl" });
        }
      }
    }
    if (requireFutureStart && data.startsAt && new Date(data.startsAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "dateNotPast" });
    }
  });
}

export type MeetingFormValues = z.infer<typeof baseMeetingSchema>;
