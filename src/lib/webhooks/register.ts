import { getGitHubApp } from "@/lib/github/app";
import { logger } from "@/lib/logger";
import { recordDelivery } from "@/lib/webhooks/delivery";
import { handleCheckRunEvent } from "@/lib/webhooks/handlers/check-run";
import { handleCheckSuiteEvent } from "@/lib/webhooks/handlers/check-suite";
import {
  handleInstallationCreatedEvent,
  handleInstallationDeletedEvent,
} from "@/lib/webhooks/handlers/installation";
import {
  handleInstallationRepositoriesAdded,
  handleInstallationRepositoriesRemoved,
} from "@/lib/webhooks/handlers/installation-repositories";
import { handlePing } from "@/lib/webhooks/handlers/ping";
import { handlePullRequestEvent } from "@/lib/webhooks/handlers/pull-request";
import { handlePushEvent } from "@/lib/webhooks/handlers/push";

let handlersRegistered = false;

function requireInstallationId(
  installation: { id: number } | undefined | null,
  event: string,
): number {
  if (!installation?.id) {
    throw new Error(`Missing installation on ${event} webhook`);
  }
  return installation.id;
}

export function registerWebhookHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  const webhooks = getGitHubApp().webhooks;

  webhooks.on("ping", async ({ payload, id }) => {
    await handlePing(payload.zen ?? "");
    await recordDelivery({
      id,
      event: "ping",
      action: null,
      installationId: null,
      repositoryFullName: null,
      processed: true,
    });
  });

  webhooks.on("installation.created", async ({ payload, id }) => {
    const installationId = requireInstallationId(
      payload.installation,
      "installation.created",
    );
    await handleInstallationCreatedEvent(installationId, id);
    await recordDelivery({
      id,
      event: "installation",
      action: "created",
      installationId,
      repositoryFullName: null,
      processed: true,
    });
  });

  webhooks.on("installation.deleted", async ({ payload, id }) => {
    const installationId = requireInstallationId(
      payload.installation,
      "installation.deleted",
    );
    await handleInstallationDeletedEvent(installationId);
    await recordDelivery({
      id,
      event: "installation",
      action: "deleted",
      installationId,
      repositoryFullName: null,
      processed: true,
    });
  });

  webhooks.on(
    "installation_repositories.added",
    async ({ payload, id }) => {
      const installationId = requireInstallationId(
        payload.installation,
        "installation_repositories.added",
      );
      const repositoryIds = payload.repositories_added.map((repo) => repo.id);
      await handleInstallationRepositoriesAdded(
        installationId,
        repositoryIds,
        id,
      );
      await recordDelivery({
        id,
        event: "installation_repositories",
        action: "added",
        installationId,
        repositoryFullName: null,
        processed: true,
      });
    },
  );

  webhooks.on(
    "installation_repositories.removed",
    async ({ payload, id }) => {
      const installationId = requireInstallationId(
        payload.installation,
        "installation_repositories.removed",
      );
      const repositoryIds = payload.repositories_removed.map((repo) => repo.id);
      await handleInstallationRepositoriesRemoved(
        installationId,
        repositoryIds,
      );
      await recordDelivery({
        id,
        event: "installation_repositories",
        action: "removed",
        installationId,
        repositoryFullName: null,
        processed: true,
      });
    },
  );

  webhooks.on("push", async ({ payload, id }) => {
    const installationId = requireInstallationId(
      payload.installation,
      "push",
    );

    await handlePushEvent({
      installationId,
      repositoryId: payload.repository.id,
      repositoryFullName: payload.repository.full_name,
      ref: payload.ref,
      after: payload.after,
      deliveryId: id,
    });

    await recordDelivery({
      id,
      event: "push",
      action: null,
      installationId,
      repositoryFullName: payload.repository.full_name,
      processed: true,
    });
  });

  webhooks.on("pull_request", async ({ payload, id }) => {
    if (!("installation" in payload) || !payload.installation?.id) {
      await recordDelivery({
        id,
        event: "pull_request",
        action: payload.action,
        installationId: null,
        repositoryFullName: payload.repository.full_name,
        processed: false,
      });
      return;
    }

    const installationId = payload.installation.id;

    await handlePullRequestEvent({
      installationId,
      repositoryId: payload.repository.id,
      repositoryFullName: payload.repository.full_name,
      action: payload.action,
      pullRequestNumber: payload.pull_request.number,
      headRef: payload.pull_request.head.ref,
      headSha: payload.pull_request.head.sha,
      deliveryId: id,
    });

    await recordDelivery({
      id,
      event: "pull_request",
      action: payload.action,
      installationId,
      repositoryFullName: payload.repository.full_name,
      processed: true,
    });
  });

  webhooks.on("check_run", async ({ payload, id }) => {
    await handleCheckRunEvent({
      action: payload.action,
      name: payload.check_run.name,
      status: payload.check_run.status ?? "queued",
      conclusion: payload.check_run.conclusion,
      repositoryFullName: payload.repository.full_name,
      headSha: payload.check_run.head_sha,
      installationId: payload.installation?.id ?? null,
    });

    await recordDelivery({
      id,
      event: "check_run",
      action: payload.action,
      installationId: payload.installation?.id ?? null,
      repositoryFullName: payload.repository.full_name,
      processed: true,
    });
  });

  webhooks.on("check_suite", async ({ payload, id }) => {
    const appSlug =
      "app" in payload.check_suite && payload.check_suite.app?.slug
        ? payload.check_suite.app.slug
        : null;

    await handleCheckSuiteEvent({
      action: payload.action,
      status: payload.check_suite.status ?? "queued",
      conclusion: payload.check_suite.conclusion,
      repositoryFullName: payload.repository.full_name,
      headSha: payload.check_suite.head_sha ?? "",
      appSlug: appSlug ?? null,
      checkRuns: [],
      installationId: payload.installation?.id ?? null,
    });

    await recordDelivery({
      id,
      event: "check_suite",
      action: payload.action,
      installationId: payload.installation?.id ?? null,
      repositoryFullName: payload.repository.full_name,
      processed: true,
    });
  });

  webhooks.onError((error) => {
    logger.error("Webhook handler error", {
      message: error.message,
      name: error.name,
    });
  });

  handlersRegistered = true;
  logger.info("GitHub webhook handlers registered");
}
