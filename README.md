# FACN — Fast Access Care Network

A telemedicine platform for Dire Dawa, Ethiopia. Connects patients, nurses, rural health officers, and specialist doctors through a unified digital infrastructure with AI-assisted triage.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Backend:** Convex (reactive DB + server functions)
- **Authentication:** Clerk (JWT, OAuth, orgs)
- **Styling:** Tailwind CSS 4
- **AI Triage:** Claude (Anthropic API)
- **Charts:** Recharts

## Features

- **Role-based dashboards** — separate views for Patients, Doctors, Nurses, Rural HOs, and Admins
- **Smart Triage** — AI-powered symptom analysis using Claude
- **Appointment scheduling** — book and manage in-person/remote visits
- **Vitals tracking** — record and monitor BP, heart rate, O2 sat, temperature, glucose
- **Consultations** — rural HOs request specialist advice; doctors pick up cases
- **Prescriptions & Lab Results** — digital ordering and results management
- **Admin panel** — user approval, audit logs, hospital/pharmacy management
- **Real-time availability** — doctors toggle availability with GPS location sharing

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
```

### Environment Variables

Copy `env.local.example` to `.env.local` (or edit the existing one):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL (from Clerk Dashboard → JWT Templates → convex) |
| `CLAUDE_API_KEY` | Anthropic API key for AI triage |

### Run Development

Start both servers in separate terminals:

```bash
# Terminal 1 — Convex backend (auto-deploys on file changes)
npx convex dev

# Terminal 2 — Next.js frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy Convex Functions

```bash
npx convex deploy
```

## Project Structure

```
app/                    # Next.js App Router pages
  dashboard/            # Main dashboard with role-based sections
  admin/                # Admin panel (users, audit logs, hospitals, pharmacies)
  appointments/         # Appointment management
  consultations/        # Specialist consultation network
  doctors/              # Doctor directory and map view
  lab/                  # Lab results
  patients/             # Patient registry and profiles
  prescriptions/        # Prescription management
  profile/              # User profile
  settings/             # App settings
  triage/               # AI symptom analysis
  vitals/               # Vitals recording and history
  providers.tsx         # Clerk + Convex provider wrapper
  layout.tsx            # Root layout
  page.tsx              # Landing page
convex/                 # Convex backend
  schema.ts             # Database schema (14 tables)
  users.ts              # User management functions
  appointments.ts       # Appointment queries and mutations
  doctors.ts            # Doctor availability and location
  patients.ts           # Patient queries
  admin.ts              # Admin statistics
  vitals.ts             # Vitals recording
  prescriptions.ts      # Prescription management
  consultations.ts      # Consultation requests
  notifications.ts      # Notification queries
  hospitals.ts          # Hospital CRUD
  pharmacies.ts         # Pharmacy CRUD
  labResults.ts         # Lab result management
  auditLogs.ts          # Audit trail
  triage.ts             # Claude AI integration
  auth.config.ts        # Clerk JWT auth config
```

## Roles

| Role | Description |
|---|---|
| `PATIENT` | View own records, book appointments, track vitals |
| `DOCTOR` | Manage appointments, review patients, respond to consultations |
| `NURSE` | Record vitals, manage assigned patients |
| `RURAL_HO` | Register patients, perform triage, request specialist consultations |
| `ADMIN` | Approve users, manage hospitals/pharmacies, view audit logs |
