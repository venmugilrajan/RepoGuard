import { App } from "@octokit/app";
import { getEnv, normalizePrivateKey } from "@/lib/env";

let appInstance: App | null = null;

export function getGitHubApp(): App {
  if (appInstance) {
    return appInstance;
  }

  const env = getEnv();

  appInstance = new App({
    appId: env.GITHUB_APP_ID,
    privateKey: normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    webhooks: { secret: env.GITHUB_WEBHOOK_SECRET },
    ...(env.GITHUB_APP_CLIENT_SECRET
      ? {
          oauth: {
            clientId: env.GITHUB_APP_CLIENT_ID,
            clientSecret: env.GITHUB_APP_CLIENT_SECRET,
          },
        }
      : {}),
  });

  return appInstance;
}

export function getAppInstallUrl(state?: string): string {
  const env = getEnv();
  const base = `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`;
  if (!state) {
    return base;
  }
  const params = new URLSearchParams({ state });
  return `${base}?${params.toString()}`;
}
