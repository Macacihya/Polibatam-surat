import { z } from "zod";

export const SubmissionStatus = {
  DRAFT: "DRAFT",
  POSTED: "POSTED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
};

export const SubmissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  filepath: z.string().optional(),
  pickup_plan: z.coerce.date().optional(),

  list_consider: z.array(z.string()).default([]),
  list_observe: z.array(z.string()).default([]),
  list_decide: z.array(z.string()).default([]),

  remarks: z.string().optional(),

  is_attachment: z.coerce.boolean().default(false),
  filepath_attachment: z.string().optional(),

  status: z.string().default(SubmissionStatus.POSTED),

  groups: z.array(z.string()).default([]),
  users: z.array(z.string()).default([]),
  units: z.array(z.string()).default([]),
});

export type SubmissionSchema = z.infer<typeof SubmissionSchema>;

export const SubmissionPublishSchema = z.object({
  filepath: z.string().min(1, "Filepath is required"),
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
  date: z.coerce.date(),

  groups: z.array(z.string()).default([]),
  users: z.array(z.string()).default([]),
  units: z.array(z.string()).default([]),
});

export type SubmissionPublishSchema = z.infer<typeof SubmissionPublishSchema>;

export const DEFAULT_VERIFICATION_STAGES = [
  { stage: 1, name: "Verifikasi Administrasi", role: "Administrasi" },
  { stage: 2, name: "Verifikasi Wakil Direktur", role: "Wakil Direktur" },
  { stage: 3, name: "Pengesahan Direktur", role: "Direktur" },
] as const;

export const AssignVerifiersSchema = z.object({
  verifiers: z
    .array(
      z.object({
        stage: z.number().int().min(1).max(3),
        stage_name: z.string().optional(),
        verifier_id: z.string().min(1, "Verifier is required"),
      })
    )
    .min(1, "Minimal 1 verifikator harus dipilih")
    .max(3, "Maksimal 3 tahap verifikasi")
    .refine(
      (verifiers) => {
        const stages = verifiers.map((v) => v.stage);
        return new Set(stages).size === stages.length;
      },
      {
        message: "Tahap verifikasi tidak boleh duplikat.",
      }
    )
    .refine(
      (verifiers) => {
        const stages = verifiers.map((v) => v.stage).sort((a, b) => a - b);
        return stages.every((st, idx) => st === idx + 1);
      },
      {
        message:
          "Tahap verifikasi harus berurutan dimulai dari Tahap 1 (Administrasi).",
      }
    ),
});

export type AssignVerifiersSchema = z.infer<typeof AssignVerifiersSchema>;

export const VerifySubmissionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  remarks: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === "REJECT" && (!data.remarks || data.remarks.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Alasan penolakan wajib diisi jika menolak.",
    path: ["remarks"],
  }
);

export type VerifySubmissionSchema = z.infer<typeof VerifySubmissionSchema>;
