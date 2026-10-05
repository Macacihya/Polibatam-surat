import { z } from "zod";

export const RegulationSchema = z.object({
  filepath: z.string().optional(),
  title: z.string().min(1, "Regulation must be at least 1 character long"),
});

export const RegulationBulkSchema = z.array(RegulationSchema);

export type RegulationSchema = z.infer<typeof RegulationSchema>;
export type RegulationBulkSchema = z.infer<typeof RegulationBulkSchema>;
