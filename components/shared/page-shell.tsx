"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ClientHeaderWrapper from "@/components/ClientHeaderWrapper";
import LegalLinks from "@/components/legal/legal-links";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  /** Where "Back" goes when there is no browser history (defaults to the dashboard). */
  backHref?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  /** Hide the app header (e.g. public pages such as the privacy policy). */
  bare?: boolean;
  width?: "md" | "lg" | "xl";
  children: React.ReactNode;
};

const WIDTHS = { md: "max-w-3xl", lg: "max-w-5xl", xl: "max-w-7xl" };

/**
 * Layout for every secondary page: app header, a back button, breadcrumbs, a title row
 * with optional actions and a centred content column, so these pages look and behave alike.
 */
export default function PageShell({ title, description, backHref = "/", breadcrumbs, actions, bare, width = "lg", children }: Props) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(backHref);
  };
  const crumbs: Crumb[] = breadcrumbs ?? [{ label: "Dashboard", href: "/" }, { label: title }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {!bare && <ClientHeaderWrapper />}
      <main className={`mx-auto w-full ${WIDTHS[width]} px-4 pb-16 pt-5 sm:px-6 sm:pt-8`}>
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              {crumb.href && index < crumbs.length - 1 ? (
                <button type="button" onClick={() => router.push(crumb.href!)} className="hover:text-gray-900 hover:underline dark:hover:text-gray-100">
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-700 dark:text-gray-200">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">{title}</h1>
              {description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
        <LegalLinks className="mt-12" />
      </main>
    </div>
  );
}
