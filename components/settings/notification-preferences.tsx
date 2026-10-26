"use client";

import { useEffect, useState } from "react";
import { Baby, Bell, Heart, Loader2, Mail, MessageSquare, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/api/client";
import { api, useGetCurrentUserQuery } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/hooks";
import { useToast } from "@/lib/toast-provider";

// Keys match alert types on the API, which skips any type switched off here.
const TOPICS = [
  { key: "breeding", label: "Breeding reminders", description: "Heat checks and mating follow-ups", icon: Heart },
  { key: "birth", label: "Farrowing due", description: "A few days before a sow is due to farrow", icon: Baby },
  { key: "medication", label: "Treatments due", description: "Vaccinations, deworming and boosters", icon: Pill },
];

type Prefs = Record<string, boolean>;

/** Email notification settings, saved to the user's profile and honoured by the alert emailer. */
export default function NotificationPreferences() {
  const dispatch = useAppDispatch();
  const { showError } = useToast();
  const { data } = useGetCurrentUserQuery();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const stored = ((data?.preferences as { notifications?: Prefs } | undefined)?.notifications) ?? {};
    setPrefs({ email_alerts: true, ...Object.fromEntries(TOPICS.map(topic => [topic.key, true])), ...stored });
  }, [data]);

  if (!prefs) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  const toggle = async (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(key);
    try {
      await apiRequest.patch("/auth/me", { preferences: { notifications: next } });
      dispatch(api.util.invalidateTags(["CurrentUser"]));
    } catch (error: any) {
      setPrefs(prefs);
      showError("Could not save", error?.response?.data?.message);
    } finally {
      setSaving(null);
    }
  };

  const emailOn = prefs.email_alerts !== false;

  return (
    <Card className="bg-white/80 dark:bg-gray-800/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-5 w-5 text-amber-500" />Notifications</CardTitle>
        <p className="text-sm text-gray-500">Choose which reminders we email you. Everything still shows on your dashboard and calendar.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Email alerts</p>
              <p className="text-xs text-gray-500">Master switch for all reminder emails</p>
            </div>
          </div>
          <Switch checked={emailOn} disabled={saving !== null} onCheckedChange={value => toggle("email_alerts", value)} aria-label="Email alerts" />
        </div>
        {TOPICS.map(topic => (
          <div key={topic.key} className={`flex items-center justify-between rounded-xl border p-4 dark:border-gray-700 ${emailOn ? "" : "opacity-50"}`}>
            <div className="flex items-center gap-3">
              <topic.icon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{topic.label}</p>
                <p className="text-xs text-gray-500">{topic.description}</p>
              </div>
            </div>
            <Switch checked={prefs[topic.key] !== false} disabled={!emailOn || saving !== null} onCheckedChange={value => toggle(topic.key, value)} aria-label={topic.label} />
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-dashed p-4 opacity-70 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">SMS and WhatsApp alerts</p>
              <p className="text-xs text-gray-500">For farms without reliable email</p>
            </div>
          </div>
          <Badge variant="outline">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
