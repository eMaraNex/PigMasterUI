import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-800 dark:text-slate-100">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold">Pig Master Privacy Notice</h1>
        </div>

        <div className="space-y-6 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold">1. Information we collect</h2>
            <p>We collect the information needed to create and operate your farm account, such as your name, email address, phone number, farm details, and account activity. We may also process usage analytics to improve service quality, product reliability, and marketing performance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. How we use your information</h2>
            <p>We use your information to create and secure your account, provide farm-management tools, process subscriptions, send service updates, support troubleshooting, and improve the product. We may also use your contact details to send product updates and relevant marketing communications where you have explicitly consented.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Consent</h2>
            <p>By creating an account, you confirm that you have read and understood this policy. You consent to the collection and processing of your personal data for account administration, service analysis, and marketing purposes as described above. You may withdraw consent at any time by updating your settings or contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Data sharing</h2>
            <p>We do not sell personal data. We may share limited data with trusted providers that help us deliver payments, email delivery, analytics, and system support, only under strict confidentiality obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Security</h2>
            <p>We apply reasonable safeguards to protect account and farm information from unauthorised access, loss, or misuse. However, no digital service can guarantee absolute security, and you are responsible for protecting your login credentials.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Your rights</h2>
            <p>You may request access, correction, or deletion of your personal data, or withdraw marketing consent at any time. Contact our support team for assistance.</p>
          </section>

          <div className="pt-4">
            <Link href="/register" className="inline-flex rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
              Back to registration
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
