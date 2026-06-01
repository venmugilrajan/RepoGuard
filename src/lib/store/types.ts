export type InstallationRecord = {
  githubInstallationId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
  repositorySelection: "all" | "selected";
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type RepositoryRecord = {
  id?: string;
  githubRepoId: number;
  githubInstallationId: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string | null;
  securityScore?: number;
  lastScannedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FindingRecord = {
  id: string;
  repositoryId: string;
  repositoryFullName: string;
  scanId: string | null;
  filePath: string;
  line: number;
  secretType: string;
  severity: Severity;
  confidence: number;
  fingerprint: string;
  maskedValue: string;
  createdAt: string;
};

export type ScanTrigger =
  | "installation"
  | "push"
  | "pull_request"
  | "repository_added"
  | "manual";

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export type ScanRecord = {
  id: string;
  githubInstallationId: number;
  githubRepoId: number;
  repositoryId: string | null;
  repositoryFullName: string;
  trigger: ScanTrigger;
  status: ScanStatus;
  ref: string | null;
  commitSha: string | null;
  pullRequestNumber: number | null;
  deliveryId: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
};

export type WebhookDeliveryRecord = {
  id: string;
  event: string;
  action: string | null;
  installationId: number | null;
  repositoryFullName: string | null;
  receivedAt: string;
  processed: boolean;
};

export interface RepoGuardStore {
  upsertInstallation(record: InstallationRecord): Promise<void>;
  deleteInstallation(githubInstallationId: number): Promise<void>;
  getInstallation(
    githubInstallationId: number,
  ): Promise<InstallationRecord | null>;

  upsertRepository(record: RepositoryRecord): Promise<void>;
  removeRepository(
    githubInstallationId: number,
    githubRepoId: number,
  ): Promise<void>;
  listRepositories(githubInstallationId: number): Promise<RepositoryRecord[]>;
  getRepository(
    githubInstallationId: number,
    githubRepoId: number,
  ): Promise<RepositoryRecord | null>;
  getRepositoryById(id: string): Promise<RepositoryRecord | null>;
  countInstallations(): Promise<number>;
  countScans(options?: { githubInstallationId?: number }): Promise<number>;
  updateRepositoryMetrics(
    githubInstallationId: number,
    githubRepoId: number,
    patch: {
      securityScore: number;
      lastScannedAt: string;
    },
  ): Promise<void>;

  getScan(id: string): Promise<ScanRecord | null>;
  hasFindingFingerprint(
    repositoryId: string,
    fingerprint: string,
  ): Promise<boolean>;

  createScan(record: ScanRecord): Promise<void>;
  updateScan(
    id: string,
    patch: Partial<
      Pick<ScanRecord, "status" | "updatedAt" | "errorMessage"> & {
        filesScanned?: number;
        secretsFound?: number;
        durationMs?: number;
        startedAt?: string;
        completedAt?: string;
      }
    >,
  ): Promise<void>;
  listScans(options?: {
    githubInstallationId?: number;
    status?: ScanStatus;
    limit?: number;
  }): Promise<ScanRecord[]>;
  countFindings(options?: {
    githubInstallationId?: number;
    repositoryId?: string;
    severity?: Severity;
  }): Promise<number>;

  recordWebhookDelivery(record: WebhookDeliveryRecord): Promise<void>;
  listWebhookDeliveries(limit?: number): Promise<WebhookDeliveryRecord[]>;

  createFinding(record: Omit<FindingRecord, "id" | "createdAt">): Promise<FindingRecord>;
  getFinding(id: string): Promise<FindingRecord | null>;
  listFindings(options?: {
    githubInstallationId?: number;
    repositoryId?: string;
    severity?: Severity;
    limit?: number;
  }): Promise<FindingRecord[]>;
}
