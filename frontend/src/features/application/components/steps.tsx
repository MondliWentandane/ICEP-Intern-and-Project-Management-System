export const applicationStepNames = ['Personal', 'Studies', 'Documents', 'Review'] as const
export type ApplicationStepName = typeof applicationStepNames[number]
