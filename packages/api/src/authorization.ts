export function isAdministrator(input: {
  userId: string;
  userName: string;
  configuredUsername: string | undefined;
  firstUserId: string | undefined;
}): boolean {
  const configuredUsername = input.configuredUsername?.trim().toLowerCase();
  if (configuredUsername) {
    return input.userName.trim().toLowerCase() === configuredUsername;
  }
  return input.userId === input.firstUserId;
}
