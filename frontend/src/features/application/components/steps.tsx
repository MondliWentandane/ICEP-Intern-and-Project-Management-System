export const applicationStepNames = ['Personal', 'Studies', 'Documents', 'Review'] as const
export type ApplicationStepName = typeof applicationStepNames[number]

/** Labels for the navy step rail in the application pop-up (same order as applicationStepNames). */
export const railSteps = [
  { title: 'Tell us about yourself', caption: 'Personal details' },
  { title: 'Your studies', caption: 'Qualification, skills and CV' },
  { title: 'Supporting documents', caption: 'ID and academic record' },
  { title: 'Review and submit', caption: 'Check your answers' },
] as const

/** Sections inside each step; the tabs above the form scroll to them. */
export const stepSections: ReadonlyArray<ReadonlyArray<{ id: string; label: string }>> = [
  [{ id: 'section-name', label: 'Name' }, { id: 'section-contact', label: 'Contact' }, { id: 'section-identity', label: 'Identity' }],
  [{ id: 'section-studies', label: 'Studies' }, { id: 'section-skills', label: 'Skills' }, { id: 'section-cv', label: 'CV' }],
  [{ id: 'section-id-document', label: 'ID document' }, { id: 'section-academic-record', label: 'Academic record' }],
  [],
]
