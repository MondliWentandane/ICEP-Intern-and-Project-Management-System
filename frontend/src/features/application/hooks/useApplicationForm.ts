import { useForm } from 'react-hook-form'
import type { ApplicationForm } from '@/types'
export function useApplicationForm() { return useForm<ApplicationForm>() }
