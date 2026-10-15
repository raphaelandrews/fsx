// GitHub logins can be renamed and later claimed by someone else, so the
// numeric GitHub account ID is the only stable owner identity. The login and
// first-user rules remain as fallbacks for deployments without GITHUB_USER_ID.
export type AdminRule =
  | { kind: "githubId"; ownerGithubId: string }
  | { kind: "username"; configuredUsername: string }
  | { kind: "firstUser" };

export function resolveAdminRule(input: {
  ownerGithubId: string | undefined;
  configuredUsername: string | undefined;
}): AdminRule {
  const ownerGithubId = input.ownerGithubId?.trim();
  if (ownerGithubId) return { kind: "githubId", ownerGithubId };
  const configuredUsername = input.configuredUsername?.trim().toLowerCase();
  if (configuredUsername) return { kind: "username", configuredUsername };
  return { kind: "firstUser" };
}

export function isAdministrator(
  rule: AdminRule,
  input: {
    userId: string;
    userName: string;
    githubAccountIds?: readonly string[];
    firstUserId?: string;
  },
): boolean {
  if (rule.kind === "githubId") {
    return input.githubAccountIds?.includes(rule.ownerGithubId) ?? false;
  }
  if (rule.kind === "username") {
    return input.userName.trim().toLowerCase() === rule.configuredUsername;
  }
  return input.userId === input.firstUserId;
}

export function isAllowedGithubAccount(rule: AdminRule, githubId: string): boolean {
  return rule.kind !== "githubId" || githubId === rule.ownerGithubId;
}
