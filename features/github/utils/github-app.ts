import { App } from "octokit";
import "dotenv/config";
let githubApp: App | null = null;

function normalizePrivateKey(raw: string) {
  const trimmed = raw.trim();

  // .env may wrap the entire PEM in quotes.
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  // If it contains literal "\\n", convert to real newlines.
  if (unquoted.includes('\\n')) {
    return unquoted.replace(/\\n/g, "\n");
  }

  // Otherwise assume it already has real newlines.
  return unquoted;
}

export function getGithubApp() {
  if (!githubApp) {
    const raw = process.env.GITHUB_APP_PRIVATE_KEY!;
    const normalized = normalizePrivateKey(raw);

    // Debug-only: validate key shape without leaking key contents.
    // If this logs an unexpected shape, the JWT decode will fail with 401.
    console.log("[github-app] privateKey debug", {
      hasBegin: normalized.includes("BEGIN RSA PRIVATE KEY"),
      hasEnd: normalized.includes("END RSA PRIVATE KEY"),
      length: normalized.length,
      hasLiteralN: normalized.includes("\\n"),
      startsWith: normalized.slice(0, 30),
    });

    githubApp = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: normalized,
      webhooks: {
        secret: process.env.GITHUB_WEBHOOK_SECRET!,
      },
    });
  }

  return githubApp;
}

export function getGithubInstallUrl(userId: string) {
  const appName = process.env.GITHUB_APP_NAME;
  const url = new URL(
    `https://github.com/apps/${appName}/installations/new`
  );
  // `state` round-trips through GitHub so we can link the installation to this user.
  url.searchParams.set("state", userId);
  return url.toString();
}

