export const OBJECT_LABELS: Record<string, string> = {
  rows: "Rows",
  pens: "Pens",
  pigs: "Pigs",
  piglets: "Piglets",
  pen_history: "Pen history",
  pig_transfers: "Transfers",
  removals: "Pigs leaving",
  breeding_records: "Breeding",
  health_records: "Health",
  feeding_records: "Feeding",
  feed_stock: "Feed store",
  feeding_schedules: "Feeding schedules",
  earnings: "Earnings",
  reports: "Reports",
  alerts: "Alerts & calendar",
  team: "Team",
};

const OPERATION_WORDS: Record<string, string> = { read: "view", create: "add", update: "edit", delete: "delete", export: "export" };
const EVERYWHERE: Record<string, string> = {
  read: "View everything",
  create: "Add records anywhere",
  update: "Edit records anywhere",
  delete: "Delete records anywhere",
  export: "Export any data",
};

/** Plain-language summary of a role's permission keys, e.g. ["View everything", "Health: add, edit"]. */
export function summarisePermissions(permissions: string[]): string[] {
  if (permissions.includes("*")) return ["Full access"];
  const lines: string[] = [];
  const perObject = new Map<string, string[]>();
  for (const permission of permissions) {
    const [object, operation] = permission.split(".");
    if (object === "*") lines.push(EVERYWHERE[operation] ?? permission);
    else if (operation === "*") lines.push(`${OBJECT_LABELS[object] ?? object}: everything`);
    else perObject.set(object, [...(perObject.get(object) ?? []), OPERATION_WORDS[operation] ?? operation]);
  }
  for (const [object, operations] of perObject) lines.push(`${OBJECT_LABELS[object] ?? object}: ${operations.join(", ")}`);
  return lines;
}
