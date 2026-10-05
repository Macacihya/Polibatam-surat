import { z } from "zod";

export const GroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  users: z.array(z.string()).optional(),
  units: z.array(z.string()).optional(),

  creator_id: z.string().optional(),
  note: z.string().optional(),
});

export type GroupSchema = z.infer<typeof GroupSchema>;
