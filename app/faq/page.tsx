import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FaqList from "@/components/faq/faq-list";
import LegalLinks from "@/components/legal/legal-links";
import { FAQ_CATEGORIES } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Frequently asked questions | PigMaster",
  description: "Answers about setting up PigMaster, plans and M-Pesa payments, team roles, farm records and data privacy.",
};

// schema.org FAQPage so search engines can show the answers directly.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CATEGORIES.flatMap(category => category.items).map(item => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <ArrowLeft className="h-4 w-4" />PigMaster
        </Link>
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Help centre</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Frequently asked questions</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Everything you need to know about running your farm on PigMaster.</p>
        </header>
        <FaqList categories={FAQ_CATEGORIES} />
        <LegalLinks className="mt-12" />
      </main>
    </div>
  );
}
