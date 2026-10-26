import type React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalLinks from "./legal-links";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Readable long-form layout with a table of contents, used by the privacy policy and terms. */
export default function LegalPage({ eyebrow, title, updated, intro, sections }: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <ArrowLeft className="h-4 w-4" />PigMaster
        </Link>
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-6 space-y-1 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">On this page</p>
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`} className="block rounded-md px-2 py-1 text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated {updated}</p>
            <div className="mt-6 space-y-3 text-[15px] leading-7 text-gray-700 dark:text-gray-300">{intro}</div>
            <div className="mt-8 space-y-10">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{index + 1}. {section.title}</h2>
                  <div className="mt-3 space-y-3 text-[15px] leading-7 text-gray-700 dark:text-gray-300 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-gray-900 dark:[&_strong]:text-white">
                    {section.body}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
        <LegalLinks className="mt-10" />
      </main>
    </div>
  );
}
