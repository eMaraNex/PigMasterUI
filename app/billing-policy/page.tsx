import type { Metadata } from "next";
import Link from "next/link";
import dayjs from "dayjs";
import LegalPage, { type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, contactLine } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Billing & Pricing Policy | PigMaster",
  description: "How PigMaster prices plans by herd size, which pigs are counted, refunds and price changes.",
};

const link = "text-blue-600 underline dark:text-blue-400";

const sections: LegalSection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <ul className="space-y-2">
        <li>Each paid plan has a base price that covers a set number of pigs. Each pig above that adds a small monthly amount, up to a monthly maximum.</li>
        <li>The price is worked out from your herd on the day you pay and stays the same for the whole period you paid for.</li>
        <li>You approve every payment on your phone with M-Pesa. Nothing renews or is charged automatically.</li>
        <li>Your records are never deleted because of billing. You can always view and export them.</li>
      </ul>
    ),
  },
  {
    id: "price",
    title: "How the price is worked out",
    body: (
      <p>
        Monthly price = the plan&apos;s base price + the per-pig rate for each pig above the pigs included in the plan, up to the
        plan&apos;s monthly maximum. Yearly plans cover 12 months and cost 16% less than paying monthly. Your exact price is on the{" "}
        <Link className={link} href="/pricing">Pricing page</Link> and in the M-Pesa payment window before you pay.
      </p>
    ),
  },
  {
    id: "counting",
    title: "Which pigs are counted",
    body: (
      <ul className="space-y-2">
        <li>Live pigs on every farm you own: active, sick and quarantined pigs.</li>
        <li>Sold, dead and deleted pigs are not counted.</li>
        <li>Pigs on farms where you are only a team member count towards that farm owner&apos;s plan, not yours.</li>
      </ul>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <ul className="space-y-2">
        <li>Plans are prepaid. We do not refund part of a period because your herd got smaller, you sold pigs or you stopped using the app during it. A smaller herd lowers the price of your next payment instead.</li>
        <li>If you were charged twice, charged the wrong amount, or paid but your plan did not start, contact us within 30 days with your M-Pesa receipt number. We will fix the plan or refund the payment to the M-Pesa number that paid.</li>
        <li>If we remove a paid feature you rely on, or the service is unavailable for a long period, contact us and we will make it right.</li>
      </ul>
    ),
  },
  {
    id: "changes",
    title: "Price changes",
    body: (
      <p>
        We may change prices or per-pig rates. A change never affects a period you have already paid for; it applies from your next
        payment. Prices are set in Kenyan shillings and M-Pesa always charges the KSh amount shown. US dollar amounts are approximate
        and for information only.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    body: (
      <p>
        This policy is part of our <Link className={link} href="/terms">Terms of Service</Link>. For billing questions, {contactLine()}.
      </p>
    ),
  },
];

export default function BillingPolicyPage() {
  return (
    <LegalPage
      eyebrow="Billing & Pricing"
      title="How PigMaster pricing works"
      updated={dayjs(LEGAL.termsVersion).format("D MMMM YYYY")}
      intro={<p>Plain-language rules for paid plans: how the price is worked out, which pigs count, refunds and price changes.</p>}
      sections={sections}
    />
  );
}
