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

## Enable mock login locally

The repository includes `frontend/.env.example` with mock mode enabled for local development. Each developer should copy it to `frontend/.env.local`:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Restart the Vite development server after creating or changing the environment file:

```powershell
cd frontend
npm run dev
```

Then open the local `/login` route. The Login page shows the demo emails and shared password when mock mode is active. `frontend/.env.local` is ignored by Git and must not be committed.

## What was implemented

- Added `frontend/src/api/services/mockAuth.ts` with the four demo users and credential validation.
- Added `frontend/src/utils/authMode.ts` to enable mock authentication only when `import.meta.env.DEV` is true and `VITE_AUTH_MODE=mock`.
- Updated `frontend/src/api/services/auth.service.ts` so `Auth.login` uses the mock users in development mock mode and uses the backend API otherwise.
- Updated `frontend/src/features/auth/pages/LoginPage.tsx` to show demo credentials in development mock mode and route users by role after sign-in.
- Updated `frontend/src/context/AuthContext.tsx` to restore a valid mock session after a page refresh in mock mode.
- Updated `frontend/src/api/client.ts` so a mock session token is not sent to backend API requests.
- Updated `frontend/.env.example` and the Vite environment types for `VITE_AUTH_MODE`.
- Created the local, ignored `frontend/.env.local` for this checkout.

## Boundaries

Mock authentication only applies to the Vite development server. Production builds do not honor mock mode and continue to use backend authentication. The mock accounts are public demo fixtures and provide no real security. Do not use real personal data or real passwords in these fixtures.

This change mocks the login flow. Forgot Password and Set Password still call their API service methods. Dashboard sample figures and activity shown in the current frontend are static UI sample content; this guide does not claim that other feature API services are mocked.

## Verification

`npm run build` completed successfully after the mock login changes. The build reports the existing large JavaScript bundle warning.
