# ICEP Frontend Routes and Page Ownership

All routes are registered in `frontend/src/routes/router.tsx`. Signed-in role pages render inside the shared `DashboardLayout` (sidebar + top bar). Feature pages provide content only; do not duplicate the shared bars.

## Role dashboards

| Role | URL | Component | Source |
| --- | --- | --- | --- |
| Administrator | `/admin/dashboard` | `AdminDashboardPage` | `frontend/src/features/dashboard/pages/AdminDashboardPage.tsx` |
| WIL Handler | `/handler/dashboard` | `HandlerDashboardPage` | `frontend/src/features/dashboard/pages/HandlerDashboardPage.tsx` |
| Mentor | `/mentor/dashboard` | `MentorDashboardPage` | `frontend/src/features/dashboard/pages/MentorDashboardPage.tsx` |
| Intern (My Project landing) | `/intern/project` | `MyProjectPage` | `frontend/src/features/projects/pages/MyProjectPage.tsx` |

The third supplied design is the Intern **My Project** landing screen. It uses the existing `/intern/project` route, rather than introducing a separate `/intern/dashboard` URL, because that is the existing intern navigation label and route.

## Shared application structure

| Purpose | Path |
| --- | --- |
| Route registry and URL mapping | `frontend/src/routes/router.tsx` |
| Authentication and role checks | `frontend/src/routes/ProtectedRoute.tsx` |
| Shared signed-in shell | `frontend/src/layouts/DashboardLayout/DashboardLayout.tsx` |
| Shared left navigation | `frontend/src/layouts/DashboardLayout/Sidebar.tsx` |
| Shared top bar | `frontend/src/layouts/DashboardLayout/Topbar.tsx` |
| Role-specific sidebar items | `frontend/src/config/navigation.ts` |
| Shared colors and design tokens | `frontend/src/styles/tokens.css` |
| Global styles | `frontend/src/styles/global.css` |
| Shared dashboard page styles | `frontend/src/features/dashboard/pages/DashboardPages.module.css` |
| Public site shell | `frontend/src/layouts/PublicLayout/PublicLayout.tsx` |
| Authentication shell | `frontend/src/layouts/AuthLayout/AuthLayout.tsx` |

## Public and application routes

- `/` — Home (`features/public-site/pages/HomePage.tsx`)
- `/about` — About; `/careers` — Careers; `/careers/:positionId` — Position details; `/contact` — Contact
- `/careers/:positionId/apply` — Application form; `/careers/:positionId/apply/submitted` — Submission confirmation

## Authentication routes

- `/login` — Login
- `/forgot-password` — Forgot password
- `/create-password/:token` and `/set-password/:token` — Set password

## Admin routes

- `/admin/applicants`; `/admin/interns`; `/admin/interns/:internId`
- `/admin/campuses`; `/admin/past-interns`
- `/admin/projects`; `/admin/projects/:projectId`; `/admin/team-builder/:projectId`
- `/admin/tasks`; `/admin/tasks/review`; `/admin/calendar`; `/admin/gantt`
- `/admin/reports`; `/admin/users`; `/admin/notifications`; `/admin/emails`
- `/admin/profile`; `/admin/profile/edit`

## WIL Handler routes

- `/handler/applicants`; `/handler/interns`; `/handler/interns/:internId`
- `/handler/campuses`; `/handler/past-interns`; `/handler/notifications`
- `/handler/profile`; `/handler/profile/edit`

## Mentor routes

- `/mentor/projects`; `/mentor/projects/:projectId`; `/mentor/team-builder/:projectId`
- `/mentor/tasks`; `/mentor/tasks/review`; `/mentor/calendar`; `/mentor/gantt`
- `/mentor/notifications`; `/mentor/profile`; `/mentor/profile/edit`

## Intern routes

- `/intern/project`; `/intern/projects/:projectId`; `/intern/tasks`; `/intern/calendar`
- `/intern/notifications`; `/intern/profile`; `/intern/profile/edit`

## Adding a page

1. Add the page under `frontend/src/features/<feature>/pages/`.
2. Register the import and URL in `frontend/src/routes/router.tsx` under the correct role.
3. Add an allowed sidebar item in `frontend/src/config/navigation.ts` if it should appear in navigation.
4. Keep permissions enforced by route guards and the backend, not only by hiding links.
5. Reuse the shared shell, components, and design tokens. Do not recreate the bars.

`/403` and unmatched URLs render the not-found page.
