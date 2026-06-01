# RepoGuardX Detector Reference

> Auto-generated from detector catalog v2.0.0 (30 detectors).
> Regenerate: `npm run docs:detectors`

## Overview

RepoGuardX uses a layered detection pipeline:

1. **Regex detectors** — provider-specific patterns with metadata and priority ordering
2. **Entropy detectors** — quoted high-entropy strings
3. **Context assignment** — `secret=`, `api_key=`, and similar variable assignments
4. **Confidence scoring** — base score + context, validation, category, and path boosts
5. **False-positive filters** — placeholders, docs/fixtures, npm integrity hashes, examples

Findings below **0.55** confidence are dropped. Values are never stored in full — only masked previews and fingerprints.

## Categories

- **AI / ML** (`ai_ml`)
- **Cloud providers** (`cloud_provider`)
- **CI/CD & version control** (`cicd_vcs`)
- **Communication** (`communication`)
- **Payments** (`payment`)
- **Commerce** (`commerce`)
- **Databases** (`database`)
- **Identity & crypto** (`identity`)

## Confidence model

| Factor | Effect |
| --- | --- |
| `baseConfidence` | Per-detector baseline (0–1) |
| Context keywords | +0.12 when nearby line matches |
| `validate()` passed | +0.08 |
| Category boost | +0.02–0.04 |
| High-specificity prefix | +0.05 |
| Critical severity | +0.02 |
| `.env` file path | +0.06 |
| Comment-only line | −0.08 |
| `contextRequired` | No match without context |

## Detectors

### AI / ML

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `anthropic_api_key` | Anthropic API Key | Critical | 0.97 | no |
| `openai_api_key` | OpenAI API Key | Critical | 0.96 | no |
| `google_gemini_api_key` | Google Gemini API Key | Critical | 0.88 | no |
| `huggingface_token` | Hugging Face Token | High | 0.94 | no |

#### `anthropic_api_key`

Anthropic Claude API key (sk-ant-api03-...)

Reference: https://docs.anthropic.com/en/api/getting-started

Context keywords: `anthropic`, `claude`

#### `openai_api_key`

OpenAI API key (sk-...)

Reference: https://platform.openai.com/docs/api-reference

Context keywords: `openai`, `gpt`

#### `google_gemini_api_key`

Google API key used by Gemini / Google AI Studio

Reference: https://ai.google.dev/gemini-api/docs/api-key

Context keywords: `gemini`, `google_ai`, `generativelanguage`, `google cloud`

#### `huggingface_token`

Hugging Face access token (hf_...)

Reference: https://huggingface.co/docs/hub/security-tokens

Context keywords: `huggingface`, `hf_token`

### Cloud providers

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `gcp_service_account` | Google Cloud Service Account Key | Critical | 0.93 | no |
| `firebase_web_api_key` | Firebase Web API Key | High | 0.9 | yes |
| `aws_access_key_id` | AWS Access Key ID | Critical | 0.92 | no |
| `azure_storage_account_key` | Azure Storage Account Key | Critical | 0.91 | no |
| `azure_client_secret` | Azure Client Secret | Critical | 0.86 | no |
| `cloudflare_api_token` | Cloudflare API Token | High | 0.9 | no |
| `digitalocean_token` | DigitalOcean Token | High | 0.95 | no |
| `supabase_service_role_key` | Supabase Service Role Key | Critical | 0.94 | no |

#### `gcp_service_account`

GCP/Firebase service account JSON credential

Reference: https://cloud.google.com/iam/docs/service-account-creds

Context keywords: `private_key`, `client_email`, `project_id`, `googleusercontent`

#### `firebase_web_api_key`

Firebase web API key (AIzaSy...)

Reference: https://firebase.google.com/docs/projects/api-keys

Context keywords: `firebase`, `firebaseconfig`, `firebaseapp`

#### `aws_access_key_id`

AWS access key identifier

Reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html

Context keywords: `aws`, `amazonaws`

#### `azure_storage_account_key`

Azure Storage connection string or account key

Reference: https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage

Context keywords: `azure`, `blob.core.windows.net`, `accountkey`

#### `azure_client_secret`

Azure AD application client secret

Reference: https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app

Context keywords: `azure`, `client_secret`, `tenant_id`, `client_id`

#### `cloudflare_api_token`

Cloudflare API token assigned in config (40-char opaque value)

Reference: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

Context keywords: `cloudflare`, `cf_api`

#### `digitalocean_token`

DigitalOcean personal access token

Reference: https://docs.digitalocean.com/reference/api/create-personal-access-token/

#### `supabase_service_role_key`

Supabase service role secret key

Reference: https://supabase.com/docs/guides/api/api-keys

Context keywords: `supabase`, `service_role`

### CI/CD & version control

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `github_pat_classic` | GitHub Personal Access Token | Critical | 0.96 | no |
| `github_pat_fine_grained` | GitHub Fine-Grained PAT | Critical | 0.96 | no |
| `gitlab_token` | GitLab Token | Critical | 0.95 | no |

#### `github_pat_classic`

GitHub classic personal access token

Reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

#### `github_pat_fine_grained`

GitHub fine-grained personal access token

#### `gitlab_token`

GitLab personal access token

Reference: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html

### Communication

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `slack_token` | Slack Token | High | 0.93 | no |
| `discord_bot_token` | Discord Bot Token | High | 0.9 | no |
| `telegram_bot_token` | Telegram Bot Token | High | 0.9 | no |
| `sendgrid_api_key` | SendGrid API Key | High | 0.96 | no |
| `twilio_api_key` | Twilio API Key | High | 0.94 | no |
| `twilio_account_sid` | Twilio Account SID | Medium | 0.75 | yes |
| `resend_api_key` | Resend API Key | High | 0.95 | no |

#### `slack_token`

Slack bot or user token

Reference: https://api.slack.com/authentication/token-types

#### `discord_bot_token`

Discord bot token

#### `telegram_bot_token`

Telegram bot API token

#### `sendgrid_api_key`

SendGrid API key

Reference: https://docs.sendgrid.com/ui/account-and-settings/api-keys

#### `twilio_api_key`

Twilio API key (SK...)

Reference: https://www.twilio.com/docs/iam/api-keys

Context keywords: `twilio`

#### `twilio_account_sid`

Twilio account SID (often paired with auth token)

Context keywords: `twilio`, `auth_token`

#### `resend_api_key`

Resend API key (re_...)

Reference: https://resend.com/docs/api-reference/introduction

### Payments

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `stripe_live_secret` | Stripe Live Secret Key | Critical | 0.96 | no |
| `stripe_live_publishable` | Stripe Live Publishable Key | High | 0.88 | no |

#### `stripe_live_secret`

Stripe live secret API key

Reference: https://stripe.com/docs/keys

#### `stripe_live_publishable`

Stripe live publishable key

### Commerce

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `shopify_token` | Shopify Token | Critical | 0.95 | no |

#### `shopify_token`

Shopify admin or storefront access token

Reference: https://shopify.dev/docs/apps/auth/admin-app-access-tokens

Context keywords: `shopify`, `myshopify`

### Databases

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `mongodb_connection` | MongoDB Connection String | Critical | 0.93 | no |
| `postgres_connection` | PostgreSQL Connection String | Critical | 0.93 | no |
| `mysql_connection` | MySQL Connection String | Critical | 0.91 | no |

#### `mongodb_connection`

MongoDB connection URI with credentials

#### `postgres_connection`

PostgreSQL connection URI with credentials

#### `mysql_connection`

MySQL connection URI with credentials

### Identity & crypto

| ID | Secret type | Severity | Base confidence | Context required |
| --- | --- | --- | --- | --- |
| `jwt_token` | JWT Token | High | 0.82 | no |
| `private_key_pem` | Private Key | Critical | 0.99 | no |

#### `jwt_token`

JSON Web Token (three base64url segments)

Reference: https://jwt.io/introduction

#### `private_key_pem`

PEM-encoded private key material

## Testing & benchmarks

```bash
npm run test:detectors
npm run benchmark:detectors
```
