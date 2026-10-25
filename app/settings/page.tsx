"use client"

import { Suspense, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, Building2, CreditCard, Loader2, ShieldCheck, SlidersHorizontal, UserRound, Users } from "lucide-react"
import ProtectedRoute from "@/components/auth/protected-route"
import PageShell from "@/components/shared/page-shell"
import FarmSettings from "@/components/settings/farm-settings"
import ProfileSettings from "@/components/settings/profile-settings"
import TeamManagement from "@/components/settings/team-management"
import BillingSettings from "@/components/settings/billing-settings"
import NotificationPreferences from "@/components/settings/notification-preferences"
import PreferencesSettings from "@/components/settings/preferences-settings"
import PrivacySettings from "@/components/settings/privacy-settings"
import { usePermissions } from "@/lib/permissions"

const SECTIONS = [
  { key: "profile", label: "Profile & security", description: "Your details and password", icon: UserRound },
  { key: "farm", label: "Farm", description: "Name, location and currency", icon: Building2 },
  { key: "team", label: "Team & access", description: "People and their roles", icon: Users },
  { key: "billing", label: "Billing & plan", description: "Plan and payments", icon: CreditCard },
  { key: "notifications", label: "Notifications", description: "Reminder emails", icon: Bell },
  { key: "preferences", label: "Display", description: "Currency and theme", icon: SlidersHorizontal },
  { key: "privacy", label: "Privacy & data", description: "Consent and your data", icon: ShieldCheck },
] as const

type SectionKey = (typeof SECTIONS)[number]["key"]

function SettingsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { can, isOwner } = usePermissions()

  // Team needs team.read; billing is for the farm owner only.
  const sections = useMemo(
    () => SECTIONS.filter(section => (section.key !== "team" || can("team", "read")) && (section.key !== "billing" || isOwner)),
    [can, isOwner],
  )
  const requested = params.get("tab") as SectionKey | null
  const active: SectionKey = sections.some(section => section.key === requested) ? requested! : "farm"
  const select = (key: SectionKey) => router.replace(`${pathname}?tab=${key}`, { scroll: false })

  return (
    <PageShell title="Settings" description="Your account, farm, team, plan and notifications in one place." width="xl">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {sections.map(section => {
            const Icon = section.icon
            const selected = section.key === active
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => select(section.key)}
                aria-current={selected ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition lg:w-full ${
                  selected
                    ? "bg-white font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                    : "text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-blue-600" : ""}`} />
                <span>
                  <span className="block whitespace-nowrap">{section.label}</span>
                  <span className="hidden text-xs font-normal text-gray-500 lg:block">{section.description}</span>
                </span>
              </button>
            )
          })}
        </nav>
        <section className="min-w-0">
          {active === "profile" && <ProfileSettings />}
          {active === "farm" && <FarmSettings />}
          {active === "team" && <TeamManagement />}
          {active === "billing" && <BillingSettings />}
          {active === "notifications" && <NotificationPreferences />}
          {active === "preferences" && <PreferencesSettings />}
          {active === "privacy" && <PrivacySettings />}
        </section>
      </div>
    </PageShell>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}>
        <SettingsContent />
      </Suspense>
    </ProtectedRoute>
  )
}
