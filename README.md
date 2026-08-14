# Client Stage Gate Tracker

## Overview

A project management and workflow tracking platform built with Next.js, designed to manage projects through a structured stage-gate process. The application enables teams to organize work hierarchically (Projects → Stages → Phases → Modules → Workflows → Tickets), track progress with Kanban boards, manage contracts with digital signatures, and report issues with urgency levels.

## Features

- **Project & Stage Management** – Hierarchical project breakdown with customizable stages, phases, modules, and workflows
- **Ticket Boards** – Drag-and-drop Kanban boards (powered by dnd-kit) with status tracking (Pending, In Progress, Finished)
- **Contract Management** – Upload PDF contracts, manage client signatories, and execute agreements with OTP verification
- **Client & User Management** – Role-based access control (Project Owner, Project Team, Client Viewer) with department assignments
- **Issue Reporting** – Track bugs and feature requests with urgency levels and reproduction steps
- **Audit Logging** – Full history of ticket actions (creation, status changes, assignments, comments)
- **Date Rollup Engine** – Automatic timeline rollup from tickets to workflows, modules, and phases
- **Soft Delete** – All domain entities support archiving with `is_deleted` and `deleted_at`

## Tech Stack

- **Framework**: Next.js 16.2.7 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma 7.8.0) hosted on Supabase
- **Authentication**: Supabase SSR (with email/password and OTP)
- **State Management**: 
  - Server state: TanStack Query v5
  - Form state: TanStack Form v1
- **UI**: Shadcn UI (Base UI components) + Tailwind CSS v4
- **Validation**: Zod
- **Server Actions**: next-safe-action (typed action pipeline)
- **Ordering**: fractional-indexing for reorderable lists
- **Testing**: Vitest + Testing Library

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm (or yarn/pnpm)
- A Supabase project (or PostgreSQL instance with pg_trgm extension)
- Environment variables as listed below

## Getting Started

### 1. Clone Repository

```bash
git clone <repository-url>
cd client-stage-gate-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database (use pooled connection for Supabase)
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres  # Direct connection for migrations

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ALLOWED_CONNECT_ORIGINS=https://*.supabase.co
PRISMA_LOG_LEVEL=error,warn
SKIP_ENV_VALIDATION=false
```

### 4. Database Setup & Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (against your database)
npx prisma migrate deploy

# Seed sort keys (for existing data – idempotent)
npm run seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts development server with hot reload |
| `npm run build` | Generates Prisma client and builds production bundle |
| `npm start` | Starts production server |
| `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Runs Vitest unit tests |
| `npm run test:coverage` | Runs tests with coverage report |
| `npm run lint` | Runs ESLint (non‑blocking in CI) |
| `npm run knip` | Checks for unused exports/dependencies |
| `npm run format` | Formats code with Prettier |
| `npm run deploy` | Applies pending Prisma migrations to production |

## Project Structure

The codebase follows **Feature-Sliced Design (FSD)** v2.1 principles:

```
src/
├── app/                     # Next.js pages and layouts (app router)
│   ├── (app)/               # Authenticated routes (sidebar + topnav)
│   │   ├── (workspace)/     # Project workspace routes
│   │   ├── dashboard/       # Landing dashboard (WIP)
│   │   └── clients/         # Client management
│   ├── (auth)/              # Authentication routes (login, signup)
│   ├── api/                 # API routes (webhooks, notifications)
│   └── layout.tsx           # Root layout
├── components/ui/           # Shadcn UI primitives (reusable)
├── entities/                # Domain entities (client, project, ticket, etc.)
│   ├── project/             # Project entity (actions, queries, mutations)
│   ├── ticket/              # Ticket entity (actions, queries, mutations)
│   ├── stage/               # Stage entity (tree fetching, cascades)
│   └── ...                  # Other entities
├── features/                # Feature-specific business logic & UI
│   ├── auth/                # Authentication context & forms
│   ├── ticket-board/        # Kanban board with drag-and-drop
│   ├── contracts/           # Contract viewer, signatories, OTP
│   ├── project-structure/   # Stage sequence and details
│   ├── stage-editor/        # Phase stepper, modules, workflows
│   └── ...                  # Other features
├── shared/                  # Cross-cutting utilities & components
│   ├── form/                # TanStack Form bindings + custom fields
│   ├── lib/                 # Scheduling, fractional sorting, colors, strings
│   ├── query/               # TanStack Query client, cache policy, keys
│   ├── schemas/             # Zod schemas for all entities
│   ├── types/               # Shared TypeScript types
│   └── ui/                  # Shared UI components (modals, lightbox, sidebar)
├── lib/                     # Infrastructure layer
│   ├── auth/                # Authorization helpers
│   ├── supabase/            # Supabase clients (server, admin, proxy)
│   ├── prisma.ts            # Prisma singleton
│   └── safe-action.ts       # next-safe-action client
└── env.ts                   # Environment validation (@t3-oss/env-nextjs)
```

## Deployment & Infrastructure

The application is designed for deployment on **Vercel** (or any Node.js hosting) with the following infrastructure considerations:

- **Database**: Supabase PostgreSQL (pooled connection recommended for serverless)
- **Authentication**: Supabase Auth with cookie-based session management (via `@supabase/ssr`)
- **Storage**: Supabase Storage (for contract PDFs and ticket/comment images)
- **Environment Variables**: All secrets must be set in the deployment environment (see `.env` section)
- **Migrations**: Run `npx prisma migrate deploy` as part of your deployment pipeline (included in `npm run deploy`)
- **Build Process**: `prisma generate` is run automatically during `npm install`; ensure `DATABASE_URL` and `DIRECT_URL` are available at build time for schema validation
- **Content Security Policy**: The middleware (`src/proxy.ts`) sets a strict CSP with nonces for script-src; no unsafe-inline is used in production

**Recommended hosting**: Vercel (with environment variables) + Supabase (with pgBouncer enabled for pooling).

```bash
# Example Vercel deployment command
vercel --prod
```
