# ICEP Frontend

React + TypeScript frontend for the ICEP Intern and Project Management System.

## Start developing

From this directory, run:

```powershell
npm ci
npm run dev
```

Use Node.js 20.19+ or 22.12+. The terminal prints the local development URL. Stop the server with `Ctrl+C`.

## Environment

Copy `.env.example` to `.env` only when you need local API proxy settings or the development-only role preview. The backend address and API contract still need confirmation. Never put secrets in `VITE_*` variables.

## Where to code

- `src/features/` contains the assigned page and domain folders.
- `src/components/` contains shared UI and data components.
- `src/layouts/` contains public, application, auth, and dashboard shells.
- `src/routes/` and `src/config/navigation.ts` contain route guards and role navigation.
- `src/api/` contains the shared Axios client, endpoint map, and resource services.
- `src/types/`, `src/hooks/`, `src/context/`, and `src/styles/` contain shared contracts and foundations.

See `CONTRIBUTING.md` for team ownership and shared-file coordination, and the repository root `FRONTEND_SETUP.md` for the full handoff and known limitations. Page files are typed starter scaffolds; implement them against the approved Figma designs.
