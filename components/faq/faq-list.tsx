"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import type { Faq, FaqCategory } from "@/lib/faqs";
import { LEGAL } from "@/lib/legal";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function FaqAccordion({ items, idPrefix }: { items: Faq[]; idPrefix: string }) {
  return (
    <Accordion type="multiple" className="divide-y rounded-2xl border bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">
      {items.map(item => (
        <AccordionItem key={item.q} value={item.q} id={`${idPrefix}-${slug(item.q)}`} className="scroll-mt-24 border-0 px-5">
          <AccordionTrigger className="gap-4 py-4 text-left text-[15px] font-medium text-gray-900 hover:no-underline dark:text-white">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 pr-8 text-[15px] leading-7 text-gray-600 dark:text-gray-300">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Searchable, grouped FAQ accordion with a "still need help" call to action. */
export default function FaqList({ categories, showSearch = true, showContact = true }: { categories: FaqCategory[]; showSearch?: boolean; showContact?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories
      .map(category => ({ ...category, items: category.items.filter(item => `${item.q} ${item.a}`.toLowerCase().includes(term)) }))
      .filter(category => category.items.length);
  }, [categories, query]);

  return (
    <div className="space-y-8">
      {showSearch && (
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search questions, e.g. M-Pesa, workers, export" className="h-12 rounded-full pl-11 text-base" aria-label="Search the FAQ" />
        </div>
      )}
      {categories.length > 1 && !query && (
        <nav aria-label="FAQ topics" className="flex flex-wrap justify-center gap-2">
          {categories.map(category => (
            <a key={category.id} href={`#${category.id}`} className="rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:border-green-500 hover:text-green-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {category.title}
            </a>
          ))}
        </nav>
      )}
      {filtered.map(category => (
        <section key={category.id} id={category.id} className="scroll-mt-24 space-y-3">
          {categories.length > 1 && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{category.title}</h2>}
          <FaqAccordion items={category.items} idPrefix={category.id} />
        </section>
      ))}
      {filtered.length === 0 && <p className="text-center text-sm text-gray-500">No questions match &quot;{query}&quot;. Try another word or ask us directly.</p>}
      {showContact && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 p-6 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold">Still have a question?</p>
            <p className="text-sm text-white/85">Our team is happy to help you set up your farm or sort out a payment.</p>
          </div>
          {LEGAL.whatsapp ? (
            <a href={`https://wa.me/${LEGAL.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-green-700 shadow hover:bg-white/90">
              <MessageCircle className="h-4 w-4" />Chat on WhatsApp
            </a>
          ) : LEGAL.supportEmail ? (
            <a href={`mailto:${LEGAL.supportEmail}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-green-700 shadow hover:bg-white/90">Email support</a>
          ) : null}
        </div>
      )}
    </div>
  );
}
