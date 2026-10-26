"use client";

import { useCallback, useMemo } from "react";
import { useGetCurrentUserQuery } from "@/lib/redux/api";

export type PermissionOperation = "read" | "create" | "update" | "delete" | "export";

export type FarmMembership = { id: string; name: string; location?: string | null; is_owner: boolean; role_name: string };

type SessionAccess = {
  farm_permissions?: string[];
  farm_role?: { key: string; name: string; is_owner: boolean } | null;
  farms?: FarmMembership[];
};

/** Same matching rules as the API: "*", "<object>.*", "*.<operation>" and "<object>.<operation>". */
export const hasPermission = (permissions: string[] | undefined, object: string, operation: PermissionOperation) =>
  (permissions ?? []).some(permission =>
    permission === "*" ||
    permission === `${object}.*` ||
    permission === `*.${operation}` ||
    permission === `${object}.${operation}`);

/**
 * The signed-in user's role on the active farm. The API enforces every permission;
 * the UI uses this only to hide what the role cannot do.
 */
export function usePermissions() {
  const { data, isLoading } = useGetCurrentUserQuery();
  const session = (data ?? {}) as SessionAccess;
  const permissions = useMemo(() => session.farm_permissions ?? [], [session.farm_permissions]);
  // No farm yet: the user is setting up their own farm, so nothing is hidden.
  const unrestricted = !session.farm_role;
  const can = useCallback(
    (object: string, operation: PermissionOperation = "read") => unrestricted || hasPermission(permissions, object, operation),
    [permissions, unrestricted],
  );
  return {
    ready: !isLoading,
    can,
    role: session.farm_role ?? null,
    isOwner: session.farm_role?.is_owner ?? true,
    farms: session.farms ?? [],
  };
}
