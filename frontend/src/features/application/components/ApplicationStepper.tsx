import { Step, StepLabel, Stepper } from '@mui/material'
export const applicationSteps = ['Personal', 'Studies', 'Documents', 'Review']
export function ApplicationStepper({ activeStep = 0 }: { activeStep?: number }) {
  return <Stepper activeStep={activeStep}>{applicationSteps.map((step) => <Step key={step}><StepLabel>{step}</StepLabel></Step>)}</Stepper>
}
