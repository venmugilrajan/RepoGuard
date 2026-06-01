# Contributing to RepoGuardX

Thank you for helping improve RepoGuardX.

## Development setup

1. Fork and clone the repository.
2. Copy `.env.example` to `.env.local` and configure a GitHub App (see [README.md](./README.md)).
3. Run `npm install` and `npm run dev`.

## Pull requests

- Keep changes focused and include context in the PR description.
- Run `npm run lint` and `npm run build` before submitting.
- Do not commit secrets or `.env.local`.

## Code style

- TypeScript strict mode, App Router conventions.
- Match existing patterns in `src/lib` and `src/app`.
- Never persist raw secret values — fingerprints and metadata only.

## Phased delivery

Large features are delivered in phases (see [ARCHITECTURE.md](./ARCHITECTURE.md)). Open an issue before starting work that spans multiple phases.
