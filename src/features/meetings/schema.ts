import * as z from "zod";

const baseMeetingSchema = z.object({
  title: z.string().trim().min(2).max(150),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  startsAt: z.string().min(1),
  durationMinutes: z.number().min(15).max(480),
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
    if (requireFutureStart && new Date(data.startsAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "dateNotPast" });
    }
  });
}

export type MeetingFormValues = z.infer<typeof baseMeetingSchema>;
