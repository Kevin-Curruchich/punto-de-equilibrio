import { z } from "zod";

export const patientFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
  medicalHistory: z.string().max(2000).optional().or(z.literal("")),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
