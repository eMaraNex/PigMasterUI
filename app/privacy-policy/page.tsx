import type { Metadata } from "next";
import Link from "next/link";
import dayjs from "dayjs";
import LegalPage, { type LegalSection } from "@/components/legal/legal-page";
import { LEGAL, contactLine } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | PigMaster",
  description: "How PigMaster collects, uses, shares and protects personal data, and the rights you have under the Kenya Data Protection Act, 2019.",
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {LEGAL.product} is a farm management service for pig farmers. The data controller for personal data processed through
          {" "}{LEGAL.product} is <strong>{LEGAL.entity}</strong> ({LEGAL.address}). We process personal data in line with the
          {" "}Kenya Data Protection Act, 2019 and its regulations, and we apply the same standards to users outside Kenya.
        </p>
        <p>To reach us about privacy, {contactLine()}.</p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Personal data we collect",
    body: (
      <ul className="space-y-2">
        <li><strong>Account details:</strong> your name, email address, phone number and password (stored only as a one-way hash). If you sign in with Google we receive your name, email address and profile photo from Google.</li>
        <li><strong>Farm records:</strong> what you enter about your farm, such as farm name, location and GPS coordinates (only if you choose to add them), pigs, pens, breeding, health, feeding, feed purchases, sales and other income.</li>
        <li><strong>Team members:</strong> if a farm admin adds you to their farm we receive your name, email address, optional phone number and the role you were given. We record actions you take on that farm (for example &quot;added a health record&quot;) so the farm can see who did what.</li>
        <li><strong>Payments:</strong> for M-Pesa payments we keep the phone number used, the amount, plan, M-Pesa receipt number and the payment status. We never see or store your M-Pesa PIN.</li>
        <li><strong>Consent records:</strong> when you accept this policy and our Terms, or opt in to or out of marketing, we record the decision, the document version, the time, your IP address and browser type, so we can show what you agreed to.</li>
        <li><strong>Technical and usage data:</strong> IP address, browser and device type, pages used, error logs and security logs, collected when you use the app.</li>
        <li><strong>Messages:</strong> what you send us through support channels such as WhatsApp or email.</li>
      </ul>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it and our lawful basis",
    body: (
      <>
        <ul className="space-y-2">
          <li><strong>To provide the service you signed up for</strong> (performance of a contract): creating your account, storing and showing your farm records, reminders and reports, letting your team work together, processing subscriptions and sending service emails such as verification, password resets and farm alerts.</li>
          <li><strong>To meet legal obligations:</strong> keeping payment and tax records and responding to lawful requests from authorities.</li>
          <li><strong>For our legitimate interests,</strong> balanced against your rights: keeping accounts secure, preventing fraud and abuse, fixing faults, and improving the product using usage statistics. We may publish or share statistics only in aggregated, anonymised form that cannot identify you or your farm.</li>
          <li><strong>With your consent:</strong> product news, tips and offers by email or SMS. This is optional, is never a condition of using {LEGAL.product}, and you can withdraw it at any time in Settings → Notifications or through any marketing message.</li>
        </ul>
        <p>We do not sell personal data and we do not make decisions about you based solely on automated processing.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share personal data only as needed to run the service, with providers bound by contract to protect it and use it only on our instructions:</p>
        <ul className="space-y-2">
          <li><strong>Hosting and database providers</strong> that store the application and its data.</li>
          <li><strong>Email delivery providers</strong> that send account and alert emails.</li>
          <li><strong>Safaricom (M-Pesa)</strong> to process your payments.</li>
          <li><strong>Google</strong> for &quot;Sign in with Google&quot;, Google Analytics usage statistics, and YouTube for embedded tutorial videos (played in privacy-enhanced mode).</li>
          <li><strong>People on your farm:</strong> farm records are visible to team members the farm admin adds, according to their role.</li>
          <li><strong>Authorities or other parties</strong> when the law requires it, to protect rights and safety, or as part of a merger or sale of the business, with notice to you.</li>
        </ul>
        <p>Some of these providers process data outside Kenya. Where that happens we rely on the safeguards required by the Data Protection Act, such as contractual protections and providers with appropriate security standards.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul className="space-y-2">
        <li>Account and farm records are kept while your account is active.</li>
        <li>If you ask us to delete your account we delete or anonymise your personal data within 30 days, except records the law requires us to keep.</li>
        <li>Payment records are kept for as long as Kenyan tax law requires (at least five years).</li>
        <li>Consent records are kept for as long as we rely on the consent and for a reasonable period afterwards to show that we had it.</li>
        <li>Security and error logs are kept for a limited period and then deleted.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        Data is sent over encrypted connections (HTTPS). Passwords are stored as one-way hashes, sign-in sessions use secure HTTP-only
        cookies, each farm&apos;s records are kept separate from other farms, team access is limited by role, and staff access is logged.
        No system is perfectly secure; if a breach affects your personal data we will notify you and the Office of the Data Protection
        Commissioner as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Data Protection Act you have the right to:</p>
        <ul className="space-y-1">
          <li>be informed about how your data is used (this policy);</li>
          <li>access the personal data we hold about you;</li>
          <li>have inaccurate or incomplete data corrected;</li>
          <li>have your data deleted where we have no legal reason to keep it;</li>
          <li>object to processing, including for direct marketing;</li>
          <li>receive your data in a portable format (farm records can be exported to Excel or CSV in the app);</li>
          <li>withdraw consent at any time, without affecting processing done before you withdrew.</li>
        </ul>
        <p>
          You can update most details yourself in Settings. For anything else, {contactLine()}; we respond within the time the law allows.
          If you are unhappy with our response you can complain to the Office of the Data Protection Commissioner
          {" "}(<a className="text-blue-600 underline dark:text-blue-400" href="https://www.odpc.go.ke" target="_blank" rel="noreferrer">www.odpc.go.ke</a>).
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    body: (
      <ul className="space-y-2">
        <li><strong>Essential:</strong> a secure sign-in cookie that keeps you logged in. The app does not work without it.</li>
        <li><strong>Preferences:</strong> your theme, display currency and similar settings are stored in your browser.</li>
        <li><strong>Analytics:</strong> Google Analytics cookies help us understand how the app is used. You can block them in your browser settings or with Google&apos;s opt-out add-on without affecting the app.</li>
      </ul>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>{LEGAL.product} is meant for people aged 18 or over. We do not knowingly collect data from children; if you believe a child has given us data, contact us and we will delete it.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        When we change this policy we update the date at the top. If a change materially affects how we use your data we will tell you
        in the app or by email and, where the law requires, ask for your consent again. The version you accepted is kept with your consent record.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="How we handle your data"
      updated={dayjs(LEGAL.privacyVersion).format("D MMMM YYYY")}
      intro={
        <p>
          Your farm records belong to you. This policy explains what personal data {LEGAL.product} collects, why, who it is shared with,
          how long it is kept and the choices you have. Please also read our <Link className="text-blue-600 underline dark:text-blue-400" href="/terms">Terms of Service</Link>.
        </p>
      }
      sections={sections}
    />
  );
}
