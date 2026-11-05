import { PermissionLevel } from '@ai-command-center/shared';

export interface UserAuthContext {
  userId: string;
  isOwner: boolean;
  permissions: string[];
}

export function checkPermission(
  user: UserAuthContext,
  requiredAction: string,
  requiredResource: string
): boolean {
  if (user.isOwner) {
    return true; // Owner has administrative bypass over all resources
  }

  const exactKey = `${requiredAction}:${requiredResource}`;
  const wildcardResource = `${requiredAction}:*`;
  const fullWildcard = `*:*`;

  return (
    user.permissions.includes(exactKey) ||
    user.permissions.includes(wildcardResource) ||
    user.permissions.includes(fullWildcard)
  );
}

export function assertSpecialistExecutionPermission(
  specialistPermissionLevel: PermissionLevel,
  actionLevel: PermissionLevel
): boolean {
  const levels: Record<PermissionLevel, number> = {
    [PermissionLevel.READ_ONLY]: 1,
    [PermissionLevel.STANDARD_EXECUTE]: 2,
    [PermissionLevel.ELEVATED_EXECUTE]: 3,
    [PermissionLevel.CRITICAL_EXECUTE]: 4,
    [PermissionLevel.ADMIN]: 5
  };

  const currentVal = levels[specialistPermissionLevel] ?? 0;
  const requiredVal = levels[actionLevel] ?? 99;

  return currentVal >= requiredVal;
}
