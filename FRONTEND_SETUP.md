# ICEP Frontend Setup and Team Handoff

## Install and run

Use Node.js 20.19+ or 22.12+ and npm. In VS Code PowerShell:

```powershell
cd frontend
npm ci
npm run dev
```

Stop with Ctrl+C. Run `npm run build` for a production build. `package-lock.json` pins the dependency tree. No environment file is required to install.

## Frontend stack

React + TypeScript + Vite, React Router, MUI/Emotion, Axios, Lucide React, React Hook Form/Zod, and TanStack Query. The working React/Vite/Router versions from the initial setup are retained instead of downgrading to the older version examples in the reference PDF. The expanded frontend structure passes the TypeScript and Vite production build.

## Project structure

The feature-first scaffold includes public site pages, a multi-step application flow, auth pages, role dashboards, applicant/intern/project/task/calendar/report/profile pages, shared layouts, central role navigation and guards, an API client/endpoints/services layer, domain types, auth context/hooks, reusable UI/data components, design tokens, and utilities. All assigned page files exist as typed starter pages under `frontend/src/features/`; they are ready for their owners to implement against Figma.

See `frontend/CONTRIBUTING.md` for folder ownership and shared-file coordination. See `frontend/.env.example` for optional backend proxy configuration and local page-preview roles. The backend address and API field/routes still need confirmation from the backend team. Do not place secrets in Vite `VITE_*` variables.

## Scope and known decisions

Page files are scaffolds, not completed screens or API integrations. Role access follows the revised duties matrix; unresolved access such as Intern Gantt and Reports is not granted until confirmed. The Users page remains an outline because its Figma frame is missing.