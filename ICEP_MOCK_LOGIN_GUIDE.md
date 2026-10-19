# ICEP Mock Login and Demo Accounts

This guide documents the development-only mock login used to let the team review role dashboards without a backend authentication service.

## Demo accounts

All demo accounts use this password:

```text
ICEPdemo1!
```

| Role | Demo email | Name shown in the session | Landing route |
| --- | --- | --- | --- |
| Administrator | `admin@icep.local` | Alex Williamson | `/admin/dashboard` |
| WIL Handler | `handler@icep.local` | Sam Dlamini | `/handler/dashboard` |
| Mentor | `mentor@icep.local` | Morgan Mentor | `/mentor/dashboard` |
| Intern | `intern@icep.local` | Lebo Khumalo | `/intern/project` |

Enter the email and password on the normal `/login` page. The login handler chooses the account role and navigates to its landing route.

## Run locally

Mock login is the default for Vite development, so no `.env.local` file is required:

```powershell
cd frontend
npm install
npm run dev
```

Open the `/login` URL printed by Vite. The page displays the demo emails and shared password while mock mode is active. If a local env file explicitly sets `VITE_AUTH_MODE=api`, remove that setting or change it to `VITE_AUTH_MODE=mock`. Restart Vite after changing env files.

The repository's `frontend/.env.example` is a reference for optional local API configuration. Developers may copy it to `.env.local` when they need to customize the API URL; `.env.local` is ignored by Git.

## What was implemented

- Added `frontend/src/api/services/mockAuth.ts` with the four demo users and credential validation.
- Added `frontend/src/utils/authMode.ts` to enable mock authentication by default only in Vite development; developers can explicitly opt into API authentication with `VITE_AUTH_MODE=api`.
- Updated `frontend/src/api/services/auth.service.ts` so `Auth.login` uses mock users in development mock mode and uses the backend API otherwise.
- Updated `frontend/src/features/auth/pages/LoginPage.tsx` to show demo credentials in mock mode and route users by role after sign-in.
- Updated `frontend/src/context/AuthContext.tsx` to restore a valid mock session after a page refresh in mock mode.
- Updated `frontend/src/api/client.ts` so a mock session token is not sent to backend API requests.
- Updated `frontend/.env.example` and the Vite environment types.

## Boundaries

Mock authentication only applies to the Vite development server. Production builds do not honor mock mode and continue to use backend authentication. The mock accounts are public demo fixtures and provide no real security. Do not use real personal data or real passwords in these fixtures.

This change mocks the login flow. Forgot Password and Set Password still call their API service methods. Dashboard sample figures and activity shown in the current frontend are static UI sample content; this guide does not claim that other feature API services are mocked.

## Verification

`npm run build` completed successfully after the mock login changes. The build reports the existing large JavaScript bundle warning.
