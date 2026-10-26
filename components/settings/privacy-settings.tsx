"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Download, FileText, Loader2, Megaphone, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/api/client";
import { api, useGetCurrentUserQuery } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { useToast } from "@/lib/toast-provider";
import { LEGAL, contactLine } from "@/lib/legal";

type Consent = { granted: boolean; version: string; source: string; created_at: string };
const SOURCE: Record<string, string> = {
  registration: "when you signed up",
  google_sign_in: "when you signed in with Google",
  settings: "in Settings",
  team_invite: "when you joined a farm",
  admin: "by our support team",
};

/** Consent choices, what the person agreed to and how to exercise their data rights. */
export default function PrivacySettings() {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { data } = useGetCurrentUserQuery();
  const consents = ((data as { consents?: Record<string, Consent> } | undefined)?.consents) ?? {};
  const [saving, setSaving] = useState(false);
  const marketing = consents.marketing?.granted ?? false;

  const setMarketing = async (granted: boolean) => {
    setSaving(true);
    try {
      await apiRequest.patch("/auth/me", { marketing_consent: granted });
      dispatch(api.util.invalidateTags(["CurrentUser"]));
      showSuccess(granted ? "You will receive tips and offers" : "You have been unsubscribed from marketing");
    } catch (error: any) {
      showError("Could not save", error?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const describe = (consent?: Consent) =>
    consent ? `${consent.granted ? "Accepted" : "Withdrawn"} ${SOURCE[consent.source] ?? ""} on ${dayjs(consent.created_at).format("D MMM YYYY, HH:mm")} · version ${consent.version}` : "No record yet";

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5 text-blue-600" />Marketing</CardTitle>
          <p className="text-sm text-gray-500">Optional. Farm alerts and account emails are sent whatever you choose here.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium">Farming tips, product news and offers</p>
              <p className="text-xs text-gray-500">By email or SMS. {describe(consents.marketing)}</p>
            </div>
            {saving ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing messages" />}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-emerald-600" />What you agreed to</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "privacy_policy", label: "Privacy Policy", href: "/privacy-policy", current: LEGAL.privacyVersion },
            { key: "terms", label: "Terms of Service", href: "/terms", current: LEGAL.termsVersion },
          ].map(doc => (
            <div key={doc.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <Link href={doc.href} target="_blank" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{doc.label}</Link>
                  <p className="text-xs text-gray-500">{describe(consents[doc.key])}</p>
                </div>
              </div>
              {consents[doc.key] && consents[doc.key].version !== doc.current && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Updated since you accepted</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader><CardTitle className="text-base">Your data rights</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p className="flex items-start gap-2"><Download className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />Export your records any time with the Export button on Health, Feeding, Earnings and Reports (Excel or CSV).</p>
          <p className="flex items-start gap-2"><Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />To get a copy of everything we hold, correct it, or delete your account, {contactLine()}. We respond within the time the Data Protection Act allows.</p>
        </CardContent>
      </Card>
    </div>
  );
}
