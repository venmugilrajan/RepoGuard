# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | Yes |

## Reporting a vulnerability

Please **do not** open public GitHub issues for security vulnerabilities.

Email maintainers privately with:

- Description of the issue
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to acknowledge reports within 72 hours.

## Design principles

- Raw secrets are **never** stored or logged.
- Findings use masked values and stable fingerprints only.
- Webhook payloads must pass HMAC signature verification (Phase 2+).
- Installation sessions use encrypted, HTTP-only cookies.
