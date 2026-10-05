import { z } from "zod";

export const DocumentSchema = z.object({
  type: z.enum(["SURAT_TUGAS", "SURAT_KEPUTUSAN"]),
  date: z.coerce.date(),
  filepath: z.string().min(1, "File is required"),
  code: z.string().min(1, "Nomor Surat is required"),
  name: z.string().min(1, "Nama Surat is required"),
  remarks: z.string().optional(),

  users: z.array(z.string()).default([]),
  groups: z.array(z.string()).default([]),
  units: z.array(z.string()).default([]),

  submission_id: z.string().optional(),
});

export type DocumentSchema = z.infer<typeof DocumentSchema>;
