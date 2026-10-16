import { z } from 'zod'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const studyCategories = ['Undergraduate', 'Postgraduate'] as const
export const yearsOfStudy = ['1st year', '2nd year', '3rd year', '4th year'] as const

const digitsOnly = (value: string) => value.replace(/\s+/g, '')

const pdfFile = (what: string) => z
  .custom<File>((value) => value instanceof File, { message: `Upload your ${what}.` })
  .refine((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'), 'Upload a PDF file.')
  .refine((file) => file.size <= MAX_UPLOAD_BYTES, 'The file must be 5 MB or smaller.')

export const applicationSchema = z.object({
  // Step 1: position (chosen from a dropdown when the applicant starts from "Apply now") and personal details
  positionId: z.string().min(1, 'Choose the position you are applying for.'),
  firstName: z.string().trim().min(1, 'Enter your name.'),
  surname: z.string().trim().min(1, 'Enter your surname.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().refine((value) => /^(\+27|0)[6-8]\d{8}$/.test(digitsOnly(value)), 'Enter a South African mobile number, e.g. 079 299 0982.'),
  idNumber: z.string().trim().refine((value) => /^\d{13}$/.test(digitsOnly(value)), 'Your ID number must be 13 digits.'),
  // Step 2: studies
  studentNumber: z.string().trim().refine((value) => /^\d{8,10}$/.test(value), 'Enter your student number (digits only).'),
  category: z.enum(studyCategories, { message: 'Choose a category.' }),
  qualification: z.string().trim().min(2, 'Enter your qualification.'),
  yearOfStudy: z.enum(yearsOfStudy, { message: 'Choose your year of study.' }),
  // Optional: first-year and career-change applicants may not have skills to list yet.
  skills: z.array(z.string()).max(15, 'Add up to 15 skills.'),
  cv: pdfFile('CV'),
  // Step 3: documents
  idDocument: pdfFile('ID document'),
  academicRecord: pdfFile('academic record'),
  // Step 4: review
  consent: z.boolean().refine((value) => value, 'Confirm your details and consent before submitting.'),
})

export type ApplicationValues = z.output<typeof applicationSchema>
export type ApplicationInput = z.input<typeof applicationSchema>

export const stepFields: Array<Array<keyof ApplicationInput>> = [
  ['positionId', 'firstName', 'surname', 'email', 'phone', 'idNumber'],
  ['studentNumber', 'category', 'qualification', 'yearOfStudy', 'skills', 'cv'],
  ['idDocument', 'academicRecord'],
  ['consent'],
]

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
