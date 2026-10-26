import { apiRequest } from "@/lib/api/client";

export type ExportFormat = "csv" | "xlsx";

const filenameFrom = (header: string | undefined, fallback: string) =>
  header?.match(/filename="?([^"]+)"?/)?.[1] ?? fallback;

/**
 * Downloads a file the API generates (CSV or Excel). GET sends `params` as the query;
 * POST sends them as the body (used by the generic /<object>/export endpoints).
 */
export async function downloadExport(
  path: string,
  params: Record<string, unknown>,
  fallbackName: string,
  method: "get" | "post" = "get",
) {
  const response = method === "get"
    ? await apiRequest.get(path, { params, responseType: "blob" })
    : await apiRequest.post(path, params, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filenameFrom(response.headers["content-disposition"], fallbackName),
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { truncated: response.headers["x-export-truncated"] === "true" };
}

/** Reads the API's JSON error message out of a failed blob download. */
export async function exportErrorMessage(error: unknown) {
  const data = (error as { response?: { data?: Blob } })?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.message ?? "Export failed";
    } catch {
      return "Export failed";
    }
  }
  return "Export failed";
}
