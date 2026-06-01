# RepoGuardX Architecture

## Overview

RepoGuardX is a self-hostable GitHub App built on Next.js 15. It receives GitHub webhooks, scans repository content for secrets, persists metadata (never raw secrets), and surfaces findings in a dashboard with optional GitHub Check Runs.

```
┌─────────────┐     webhooks      ┌──────────────────┐
│   GitHub    │ ────────────────► │  Next.js API     │
│  (App/Repos)│ ◄───────────────► │  Routes          │
└─────────────┘   installation    └────────┬─────────┘
       │              tokens                 │
       │ install flow                        ▼
       ▼                            ┌──────────────────┐
┌─────────────┐                     │  Scanner Engine  │
│  Dashboard  │ ◄── REST/read ──── │  (regex/entropy) │
│  (App Router)│                    └────────┬─────────┘
└─────────────┘                             │
                                            ▼
                                   ┌──────────────────┐
                                   │  PostgreSQL      │
                                   │  (Prisma)        │
                                   └──────────────────┘
```

## Layers

| Layer | Responsibility |
| --- | --- |
| **GitHub integration** | App JWT, installation tokens, webhooks, check runs |
| **Scanner** | File tree + diff scanning, detectors, fingerprinting |
| **Persistence** | PostgreSQL via Prisma — users, installations, repositories, scans, findings |
| **API** | Webhook ingress, read APIs for dashboard |
| **UI** | Landing, dashboard, repository/finding views |

## Authentication model

1. **GitHub App JWT** — signed with `GITHUB_APP_PRIVATE_KEY`; used to mint installation access tokens.
2. **Installation session** — after install, `/api/github/callback` verifies the installation via GitHub and stores `installationId` + account metadata in an encrypted cookie (`iron-session`).
3. **User OAuth (optional)** — `GITHUB_APP_CLIENT_SECRET` enables linking GitHub users to installations in a later phase.

## Data model

- `User` — GitHub user (OAuth in a later phase)
- `Installation` — GitHub App installation (`githubInstallationId`)
- `Repository` — synced repo metadata + `securityScore`
- `Scan` — scan run (push, PR, install, manual)
- `Finding` — masked secret metadata only (`fingerprint`, `maskedValue`, path, line, severity)
- `WebhookDelivery` — audit log of processed webhooks

**Never stored:** raw secret values.

## Scanner pipeline

1. Resolve changed files (push/PR diff or full tree on install).
2. Fetch file contents via installation token.
3. Run detectors: regex → entropy → context rules.
4. Deduplicate by fingerprint; assign severity/confidence; mask values.
5. Persist findings; update repository `securityScore`; publish GitHub Check Run (`success` / `failure`).

## Security score (Phase 5+)

`0–100` weighted by critical/high findings, repo visibility, and historical findings.

## Deployment

- **Docker** — multi-stage Next.js image + `docker-compose` with PostgreSQL.
- **Env** — validated at runtime via Zod (`src/lib/env.ts`).

## Implementation phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | GitHub App auth, install flow, session, repo listing | **Done** |
| 2 | Webhook endpoint + signature verification | **Done** |
| 3 | Prisma schema + PostgreSQL | **Done** |
| 4 | Secret scanner engine | **Done** |
| 5 | Dashboard + findings UI | **Done** |
| 6 | GitHub Check Runs + Docker | **Done** |

## Key paths

```
src/lib/env.ts                      # Env validation
src/lib/github/app.ts               # Octokit App singleton + webhooks
src/lib/github/installation.ts      # Installation API helpers
src/lib/webhooks/register.ts        # Event handler registry
src/lib/webhooks/receive.ts         # Signature verify + dispatch
src/lib/store/                      # Store abstraction (memory → Prisma in Phase 3)
src/lib/services/installation-service.ts
src/lib/services/scan-queue.ts      # Queues scans (executed in Phase 4)
src/app/api/github/webhook          # POST webhook ingress
src/app/api/scans                   # List queued scans
src/app/api/webhooks/deliveries     # Recent webhook audit log
src/app/dashboard                   # Protected dashboard
```
