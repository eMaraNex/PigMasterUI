"use client"

import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { BadgeCheck, Building2, KeyRound, Loader2, Mail, Save, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api/client"
import { api, useGetCurrentUserQuery } from "@/lib/redux/api"
import { useAppDispatch } from "@/lib/redux/hooks"
import { usePermissions } from "@/lib/permissions"
import { useToast } from "@/lib/toast-provider"

type Session = {
  name?: string
  email?: string
  phone?: string | null
  email_verified?: boolean
  created_at?: string
  provider?: string
}

const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong"

/** Personal details, password and the farms this person can open. */
export default function ProfileSettings() {
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()
  const { data, isLoading } = useGetCurrentUserQuery()
  const session = (data ?? {}) as Session
  const { farms } = usePermissions()
  const [details, setDetails] = useState({ name: "", phone: "" })
  const [savingDetails, setSavingDetails] = useState(false)
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm: "" })
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)

  useEffect(() => {
    setDetails({ name: session.name ?? "", phone: session.phone ?? "" })
  }, [session.name, session.phone])

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>

  const saveDetails = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingDetails(true)
    try {
      await apiRequest.patch("/auth/me", { name: details.name, phone: details.phone || null })
      dispatch(api.util.invalidateTags(["CurrentUser"]))
      showSuccess("Profile saved")
    } catch (error) {
      showError("Could not save", errorText(error))
    } finally {
      setSavingDetails(false)
    }
  }

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.new_password !== passwords.confirm) {
      showError("Passwords do not match", "Type the new password the same way twice.")
      return
    }
    setSavingPassword(true)
    try {
      await apiRequest.post("/auth/change-password", { current_password: passwords.current_password, new_password: passwords.new_password })
      setPasswords({ current_password: "", new_password: "", confirm: "" })
      showSuccess("Password changed")
    } catch (error) {
      showError("Could not change password", errorText(error))
    } finally {
      setSavingPassword(false)
    }
  }

  const resendVerification = async () => {
    setSendingVerification(true)
    try {
      await apiRequest.post("/auth/resend-verification", { email: session.email })
      showSuccess("Verification email sent", `Check ${session.email}.`)
    } catch (error) {
      showError("Could not send", errorText(error))
    } finally {
      setSendingVerification(false)
    }
  }

  return (
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card className="bg-white/80 dark:bg-gray-800/70">
            <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={saveDetails} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full name</Label>
                    <Input id="profile-name" required minLength={2} value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input id="profile-phone" type="tel" placeholder="+254712345678" value={details.phone} onChange={event => setDetails({ ...details, phone: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input id="profile-email" value={session.email ?? ""} disabled className="max-w-sm" />
                    {session.email_verified ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200"><BadgeCheck className="h-3.5 w-3.5" />Verified</Badge>
                    ) : (
                      <Button type="button" size="sm" variant="outline" onClick={resendVerification} disabled={sendingVerification}>
                        {sendingVerification ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}Verify email
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingDetails}>
                    {savingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/70">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-5 w-5 text-gray-500" />Password</CardTitle></CardHeader>
            <CardContent>
              {session.provider && session.provider !== "local" ? (
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><ShieldAlert className="h-4 w-4" />You sign in with Google, so there is no password to change here.</p>
              ) : (
                <form onSubmit={changePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input id="current-password" type="password" autoComplete="current-password" required value={passwords.current_password} onChange={event => setPasswords({ ...passwords, current_password: event.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">New password</Label>
                      <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={passwords.new_password} onChange={event => setPasswords({ ...passwords, new_password: event.target.value })} />
                      <p className="text-xs text-gray-500">At least 8 characters.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password">Confirm new password</Label>
                      <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={event => setPasswords({ ...passwords, confirm: event.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingPassword}>{savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Change password</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/80 dark:bg-gray-800/70">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-gray-500" />Your farms</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {farms.length === 0 && <p className="text-sm text-gray-500">No farms yet.</p>}
              {farms.map(farm => (
                <div key={farm.id} className="rounded-lg border p-3 dark:border-gray-700">
                  <p className="text-sm font-medium">{farm.name}</p>
                  <p className="text-xs text-gray-500">{farm.role_name}{farm.location ? ` · ${farm.location}` : ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          {session.created_at && (
            <p className="px-1 text-xs text-gray-500">Member since {dayjs(session.created_at).format("MMMM YYYY")}</p>
          )}
        </div>
      </div>
  )
}
