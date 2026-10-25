import type { Metadata } from "next";
import Link from "next/link";
import dayjs from "dayjs";
import LegalPage, { type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, contactLine } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | PigMaster",
  description: "The terms for using PigMaster: accounts, farm data, team access, plans and M-Pesa payments.",
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: (
      <p>
        These terms are an agreement between you and {LEGAL.entity} for the use of {LEGAL.product}. By creating an account or using the
        service you accept them. If you use {LEGAL.product} for a business, you confirm you may accept these terms for it.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <ul className="space-y-2">
        <li>You must be 18 or over and give accurate details.</li>
        <li>Keep your password private. You are responsible for activity on your account, and you should tell us straight away if you think someone else has used it.</li>
        <li>Farm admins decide who joins their farm and which role each person has, and are responsible for removing people who should no longer have access.</li>
      </ul>
    ),
  },
  {
    id: "your-data",
    title: "Your farm data",
    body: (
      <p>
        You own the records you enter. You give us permission to store, process and display them only to provide and improve the service,
        as described in our <Link className="text-blue-600 underline dark:text-blue-400" href="/privacy-policy">Privacy Policy</Link>.
        You can export your records at any time. You are responsible for having the right to enter information about other people,
        such as team members or buyers.
      </p>
    ),
  },
  {
    id: "plans",
    title: "Plans, trials and payments",
    body: (
      <ul className="space-y-2">
        <li>New farms start with a free trial with full access. When it ends the farm moves to the Free plan unless a paid plan is bought.</li>
        <li>Paid plans are prepaid for the period shown on the pricing page and are paid with M-Pesa. You approve every payment on your phone; nothing renews or is charged automatically.</li>
        <li>A plan starts as soon as M-Pesa confirms the payment. If a payment fails or is cancelled you are not charged.</li>
        <li>Prices may change; a change never affects a period you have already paid for. If you paid by mistake or a payment went wrong, contact us with your M-Pesa receipt number and we will review it.</li>
        <li>Team members use the plan of the farm they work on.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <ul className="space-y-1">
        <li>Do not break the law, infringe others&apos; rights or upload harmful code.</li>
        <li>Do not try to access other farms&apos; data, get around permissions or overload the service.</li>
        <li>Do not resell or copy the service without our written permission.</li>
      </ul>
    ),
  },
  {
    id: "guidance",
    title: "Farm guidance is general",
    body: (
      <p>
        Feeding rations, vaccination schedules, reminders and reports are general guidance based on common practice. They are not a
        substitute for advice from a veterinarian or animal nutritionist who knows your herd. Decisions about your animals remain yours.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep {LEGAL.product} available and your data safe, but the service is provided &quot;as is&quot; and may sometimes be
        interrupted for maintenance or reasons outside our control. We may improve or change features; if we remove a feature you pay for,
        we will tell you in advance.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        To the extent the law allows, we are not liable for indirect losses such as lost profits or animal losses, and our total liability
        for any claim is limited to the amount you paid us in the 12 months before it. Nothing in these terms limits rights you have under
        the Consumer Protection Act or other laws that cannot be excluded.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Ending your account",
    body: (
      <p>
        You can stop using {LEGAL.product} at any time and ask us to delete your account. We may suspend or close accounts that break these
        terms, after notice where reasonable. Payment records are kept as the law requires.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and contact",
    body: (
      <p>
        These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction. We may update these terms and will show
        the new date above; material changes will be announced in the app. Questions? {contactLine()}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="Terms for using PigMaster"
      updated={dayjs(LEGAL.termsVersion).format("D MMMM YYYY")}
      intro={<p>Plain-language terms for farmers and their teams. Please read them together with our Privacy Policy.</p>}
      sections={sections}
    />
  );
}
