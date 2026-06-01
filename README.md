# RepoGuardX

Production-oriented, self-hostable GitHub App that scans repositories for exposed secrets, API keys, tokens, and high-entropy credentials.

## Status

**RepoGuardX is feature-complete** across all six phases: GitHub App auth, webhooks, PostgreSQL, secret scanning, dashboard UI, GitHub Check Runs, and Docker deployment.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design.

## Quick start

### 1. Create a GitHub App

1. Go to [GitHub Developer Settings → GitHub Apps](https://github.com/settings/apps) → **New GitHub App**.
2. Set **Homepage URL** to your public URL (e.g. `http://localhost:3000` for local dev).
3. Set **Callback URL** / **Setup URL** (post-install redirect) to:
   ```
   {NEXT_PUBLIC_APP_URL}/api/github/callback
   ```
4. Set **Webhook URL** to `{NEXT_PUBLIC_APP_URL}/api/github/webhook` and use the same value for `GITHUB_WEBHOOK_SECRET`.
5. Permissions:
   - **Repository metadata**: Read
   - **Contents**: Read
   - **Pull requests**: Read (for PR scans)
   - **Checks**: Read & Write (required for commit/PR check runs)
6. Subscribe to webhook events:
   - `Installation`, `Installation repositories`
   - `Push`, `Pull request`
   - `Check run`, `Check suite`
7. Generate a **private key** and note **App ID**, **Client ID**, and **App slug**.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Description |
| --- | --- |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | PEM private key (use `\n` for newlines in `.env`) |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret (used in Phase 2+) |
| `GITHUB_APP_CLIENT_ID` | OAuth client ID |
| `GITHUB_APP_SLUG` | App URL slug (`https://github.com/apps/{slug}`) |
| `NEXT_PUBLIC_APP_URL` | Public base URL of this app |
| `SESSION_SECRET` | Random string ≥ 32 characters |
| `DATABASE_URL` | PostgreSQL connection URL (required) |

### 3. Start PostgreSQL

```bash
docker compose up -d db
npm run db:migrate
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Install GitHub App**.

### Dashboard routes

| Path | Description |
| --- | --- |
| `/dashboard` | Overview stats and repository table |
| `/repositories/[id]` | Repository security score, findings, scans |
| `/findings` | All findings with severity filters |
| `/findings/[id]` | Masked finding detail |

### Docker (production)

1. Copy environment variables into `.env` (see `.env.example`).
2. Set `NEXT_PUBLIC_APP_URL` to the URL GitHub will reach (use a tunnel for local testing).
3. Start the stack:

```bash
docker compose up -d --build
```

The app container runs `prisma migrate deploy` on startup, then serves on port **3000**. Health check: `GET /api/health`.

### GitHub Check Runs

After each scan, RepoGuardX publishes a check named **RepoGuardX / Secret Scan**:

| Result | When |
| --- | --- |
| **Passed** | No secrets detected in the scanned changeset |
| **Failed** | Secrets detected — e.g. `Critical secret found: OpenAI API Key` |

Checks appear on commits and pull requests when **Checks: Read & Write** is granted.

### Webhook testing (local)

Use [smee.io](https://smee.io/) or GitHub’s “Recent deliveries” to forward webhooks to your dev server:

```bash
npx smee -u https://smee.io/YOUR_CHANNEL -t http://localhost:3000/api/github/webhook
```

### API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/github/webhook` | GitHub webhook ingress (HMAC verified) |
| `GET` | `/api/github/install` | Redirect to GitHub App installation |
| `GET` | `/api/github/callback` | Setup URL — verifies installation, sets session |
| `GET` | `/api/github/session` | Current installation session JSON |
| `DELETE` | `/api/github/session` | Clear session |
| `GET` | `/api/github/signout` | Clear session and redirect home |
| `GET` | `/api/github/repositories` | Repositories accessible to installation |
| `GET` | `/api/repositories` | Alias of `/api/github/repositories` |
| `GET` | `/api/scans` | Queued/recent scans for installation |
| `POST` | `/api/scans/[id]/run` | Re-queue a scan |
| `GET` | `/api/findings` | Findings for installation |
| `GET` | `/api/findings/[id]` | Single finding (masked) |
| `GET` | `/api/webhooks/deliveries` | Recent webhook delivery log |
| `GET` | `/api/health` | Health check (database connectivity) |
| `POST` | `/api/repositories/[id]/scan` | Trigger manual repository scan |

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Octokit (`@octokit/app`, `@octokit/rest`)
- PostgreSQL + Prisma (Phase 3+)
- Docker + Docker Compose (`Dockerfile`, `docker-compose.yml`)

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports: [SECURITY.md](./SECURITY.md).
