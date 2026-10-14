# Frontend contribution guide

## Start coding

Run `npm ci` and `npm run dev` in `frontend/`. Implement the Figma screen in its existing feature folder and call the matching service in `src/api/services/`; do not call Axios directly from a page.

## Feature ownership

- Manthata: shared layouts, components, routes, auth, API client/contracts, Users, and integration reviews.
- CJ: `src/features/tasks/` and `src/features/projects/pages/ProjectDetailPage.tsx`.
- Moeez: `src/features/gantt/`, `src/features/calendar/`, and Mentor dashboard.
- Mickie: Projects list/My Project, Team Builder, and Reports.
- Gidi: Application flow, public Careers/Position Detail, Profile/Edit Profile, and Past Interns.
- Mmabatho: Applicants, Interns list, Notifications/Email Templates, About, and Contact.
- Wendy: Handler/Admin dashboards, Intern Profile, Campuses/Intakes, and public Home.

Coordinate changes to shared `components/`, `api/`, `types/`, `layouts/`, `routes/`, `context/`, and `styles/` with Manthata before editing, so parallel work does not overwrite shared files. Use the prepared files instead of creating duplicate routes or folders.

## Integration notes

Backend paths and response shapes are assumptions until the backend team confirms them. Update `src/api/endpoints.ts`, resource services, and types after that meeting. Role navigation and guards follow the revised duties matrix. Unresolved permissions remain excluded. The Users page is a scaffold because no Figma frame exists yet.
