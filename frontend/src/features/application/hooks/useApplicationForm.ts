import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ApplicationInput, type ApplicationValues } from '../data/applicationSchema'

export function useApplicationForm(positionId = '') {
  return useForm<ApplicationInput, unknown, ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    mode: 'onTouched',
    defaultValues: { positionId, firstName: '', surname: '', email: '', phone: '', idNumber: '', studentNumber: '', category: 'Undergraduate', qualification: '', skills: [], consent: false },
  })
}
