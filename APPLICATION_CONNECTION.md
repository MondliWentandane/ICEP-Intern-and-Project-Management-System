# Intern applications – frontend ↔ backend ↔ database

Only the application flow was connected. The design was not changed.

## Changed / new files

Backend
- `src/server.ts` – mounts `routes/applicationRoutes` under `/api` (it was never mounted before).
- `src/routes/applicationRoutes.ts` – real `GET /positions`, `GET /positions/:id`, `GET /applicants/:id/documents`,
  `GET /applicants/:id/documents/:documentId/download`; upload errors now answer 400 JSON.
- `src/controllers/ApplicationController.ts` – `POST /applications` saves the multipart form; interview venue; document download.
- `src/controllers/PositionController.ts` (new) – careers positions from the database.
- `src/services/ApplicationService.ts` – `submit()` saves details, skills and the three PDFs; reference `ICEP-YYYY-NNNNN`;
  duplicate check (same email + position); positions stay open until the end of the closing date; reject reason optional.
- `src/services/DocumentStorage.ts` (new) – PDFs go to Supabase Storage (bucket `SUPABASE_STORAGE_BUCKET`),
  or to `backend/uploads/` if Supabase is not set up or the upload fails.
- `src/repositories/ApplicationRepository.ts` – saves documents and reference code with the application.
- `prisma/seed.ts` – adds the 6 careers positions (same ids as the old frontend links), eMalahleni campus, "2027 Intake 1".
- `prisma.config.ts` – `npx prisma db seed` now works.
- `.gitignore` – ignores `uploads/`.

Frontend
- `src/features/public-site/data/positions.ts` – positions come from the API (demo list removed).
- `src/features/application/data/submitApplication.ts` – posts the form + PDFs to `POST /api/applications`.
- `src/features/application/components/ApplicationDialog.tsx` – shows the backend's error message (e.g. already applied).
- `src/features/applicants/data/applicationsApi.ts` (new) – API calls for applicants.
- `src/features/applicants/pages/ApplicantsPage.tsx` – real applicants; Interview / Accept / Reject are saved.
- `src/features/interns/pages/InternsPage.tsx` – real applicants/interns; profile shows real details; Download CV downloads the uploaded CV.
- `.env.example` – `VITE_API_PROXY_TARGET=http://localhost:5000`.

## Run it

```bash
# backend
cd backend
npx prisma db push      # only if the tables / interviewVenue column are not in the database yet
npx prisma db seed      # positions, campuses, intake, skills, admin (admin@icep.local / ChangeMe123!)
npm run dev

# frontend (frontend/.env must contain VITE_API_PROXY_TARGET=http://localhost:5000)
cd frontend
npm run dev
```

Apply on the Careers page, then log in as an Admin or WIL Handler and open Applicants / Interns.
