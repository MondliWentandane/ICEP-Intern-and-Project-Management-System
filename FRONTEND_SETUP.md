# ICEP Frontend Setup and Handoff

## What was set up

The `frontend/` directory is a standalone React frontend starter in the ICEP repository. It gives the team a shared foundation to begin implementing the Figma designs and app pages.

- React with TypeScript, bootstrapped with Vite
- React Router for the public/auth and app route foundation
- MUI with Emotion for the component library and theme
- React Hook Form and Zod for form handling and validation
- TanStack Query for server-state/API integration
- `package-lock.json` so everyone installs the same dependency versions

## Run it locally

Use Node.js 20.19+ or 22.12+ (the current Vite requirement) and npm. In the VS Code PowerShell terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Vite prints the local URL in the terminal. Stop it with `Ctrl+C`. To create a production build, run:

```powershell
npm run build
```

The production build was run successfully when this starter was prepared.

## Current source layout

```text
frontend/
├── public/                     Static public assets
├── src/
│   ├── app/
│   │   ├── App.tsx              Router entry
│   │   ├── router.tsx           Public and app route definitions
│   │   └── theme.ts             Initial ICEP/MUI theme tokens
│   ├── features/
│   │   ├── auth/pages/          Login, Forgot Password, Set Password
│   │   └── shared/pages/        Shared placeholder page
│   ├── layouts/
│   │   ├── AuthLayout.tsx       Layout for auth screens
│   │   └── AppLayout.tsx        Initial protected-app shell placeholder
│   ├── styles/global.css        Global layout styles
│   └── main.tsx                 React bootstrap and providers
├── package.json
└── package-lock.json
```

## Routes and current limits

The starter has initial routes for `/login`, `/forgot-password`, `/set-password/:token`, `/app`, `/app/dashboard`, and `/app/profile`. These are structural starting points. The pages are placeholders and the app routes do not yet enforce authentication or role permissions. Login, password reset, API calls, final role-based navigation, and the final Figma-matched shell still need implementation.

The initial theme uses draft values from the project documents; check them against the final Figma style library before treating them as final design tokens.

## Environment variables

No frontend `.env` file is needed to install or run this starter. The frontend is not connected to the backend yet. Once the backend team confirms the API base URL and authentication approach, add a documented public setting such as `VITE_API_BASE_URL` to `.env.example`. Keep machine-specific `.env` files out of Git, and never place secrets in Vite variables because frontend values are bundled for browser use.

## Suggested next work

1. Add the final Figma shell and role-specific navigation using the agreed duties matrix.
2. Implement the auth screens and states against the Figma frames.
3. Add centralized route permissions and authentication state.
4. Connect forms and data views after the backend API contract is confirmed.
5. Expand shared buttons, inputs, badges, tables, filters, cards, and modal components as the page owners begin their screens.
