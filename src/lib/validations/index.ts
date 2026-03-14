import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['PRACTITIONER', 'CLIENT']),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const AppointmentSchema = z.object({
  clientId: z.string().cuid(),
  datetime: z.string().datetime(),
  duration: z.number().min(30).max(120).default(50),
})

export const NoteSchema = z.object({
  appointmentId: z.string().cuid(),
  type: z
    .enum(['SOAP', 'PROGRESS', 'INTAKE', 'ASSESSMENT', 'TREATMENT_PLAN'])
    .default('SOAP'),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})

export const ClientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  diagnosis: z.string().optional(),
  medications: z.string().optional(),
  treatmentHistory: z.string().optional(),
})

export const IntakeFormSchema = z.object({
  clientProfileId: z.string().cuid(),
  answers: z.record(z.string(), z.unknown()),
})
