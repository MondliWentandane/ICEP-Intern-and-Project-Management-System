// Confirm these assumed routes with the backend team before integration.
export const endpoints = {
  auth: { login: '/auth/login', me: '/auth/me', forgotPassword: '/auth/forgot-password', createPassword: '/auth/confirm-password' },
  public: { positions: '/positions', applications: '/applications', contact: '/contact' },
  applicants: '/applicants', interns: '/interns', campuses: '/campuses', projects: '/projects', tasks: '/tasks',
  notifications: '/notifications', emailTemplates: '/email-templates', dashboards: '/dashboards', reports: '/reports', users: '/users',
} as const
