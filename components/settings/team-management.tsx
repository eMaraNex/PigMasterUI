"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Crown, Loader2, Mail, MoreHorizontal, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api/client";
import { usePermissions } from "@/lib/permissions";
import { summarisePermissions } from "@/lib/permission-labels";
import { useToast } from "@/lib/toast-provider";

dayjs.extend(relativeTime);

type Role = { id: number; key: string; name: string; description: string | null; permissions: string[] };
type Member = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role_name: string;
  role_key: string;
  farm_role_id: number;
  status: "active" | "disabled" | "invited";
  is_owner: boolean;
  password_set: boolean;
  last_login: string | null;
  joined_at: string | null;
};

const emptyInvite = { name: "", email: "", phone: "", farm_role_id: "" };
const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong";

/**
 * Farm team: farm admins invite people and give each one a role. What every role
 * may do is defined by the PigMaster team; the API enforces it on every request.
 */
export default function TeamManagement() {
  const { can } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  const canInvite = can("team", "create");
  const canEdit = can("team", "update");
  const canRemove = can("team", "delete");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [team, roleList] = await Promise.all([
        apiRequest.get("/team/list", { params: { limit: 200 } }),
        apiRequest.get("/team/roles"),
      ]);
      setMembers(team.data.data);
      setRoles(roleList.data.data);
    } catch (error) {
      showError("Could not load the team", errorText(error));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const selectedRole = useMemo(() => roles.find(role => String(role.id) === invite.farm_role_id), [roles, invite.farm_role_id]);

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiRequest.post("/team/invite", { ...invite, farm_role_id: Number(invite.farm_role_id), phone: invite.phone || null });
      const result = response.data.data;
      showSuccess(
        "Team member added",
        result.new_account
          ? result.email_sent ? `We emailed ${invite.email} a link to set their password.` : "The invite email could not be sent; ask them to use \"Forgot password\" on the login page."
          : `${invite.name} can now open this farm.`,
      );
      setInviteOpen(false);
      setInvite(emptyInvite);
      load();
    } catch (error) {
      showError("Could not add team member", errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const update = async (member: Member, data: Partial<Pick<Member, "farm_role_id" | "status">>, message: string) => {
    try {
      await apiRequest.patch(`/team/update/${member.id}`, data);
      showSuccess(message);
      load();
    } catch (error) {
      showError("Update failed", errorText(error));
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await apiRequest.delete(`/team/delete/${removing.id}`);
      showSuccess(`${removing.name} no longer has access`);
      setRemoving(null);
      load();
    } catch (error) {
      showError("Could not remove", errorText(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-blue-600" />Team members</CardTitle>
            <p className="mt-1 text-sm text-gray-500">People who can open this farm and what they are allowed to do.</p>
          </div>
          {canInvite && (
            <Button onClick={() => setInviteOpen(true)} className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <UserPlus className="mr-2 h-4 w-4" />Add member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <ul className="divide-y dark:divide-gray-700">
              {members.map(member => (
                <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-blue-100 text-sm font-semibold text-blue-800 dark:from-green-900 dark:to-blue-900 dark:text-blue-100">
                    {member.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {member.name}
                      {member.is_owner && <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200"><Crown className="h-3 w-3" />Owner</Badge>}
                      {member.status === "disabled" && <Badge variant="secondary">Disabled</Badge>}
                      {!member.password_set && <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />Invite pending</Badge>}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {member.email}
                      {member.last_login ? ` · active ${dayjs(member.last_login).fromNow()}` : " · never signed in"}
                    </p>
                  </div>
                  {member.is_owner || !canEdit ? (
                    <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />{member.role_name}</Badge>
                  ) : (
                    <select
                      value={member.farm_role_id}
                      onChange={event => update(member, { farm_role_id: Number(event.target.value) }, `${member.name} is now ${roles.find(role => role.id === Number(event.target.value))?.name}`)}
                      className="h-9 rounded-md border bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      aria-label={`Role for ${member.name}`}
                    >
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  )}
                  {!member.is_owner && (canEdit || canRemove) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${member.name}`}><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => update(member, { status: member.status === "disabled" ? "active" : "disabled" }, member.status === "disabled" ? `${member.name} can sign in to this farm again` : `${member.name} is paused`)}>
                            {member.status === "disabled" ? "Re-enable access" : "Pause access"}
                          </DropdownMenuItem>
                        )}
                        {canRemove && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setRemoving(member)}>Remove from farm</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="text-base">What each role can do</CardTitle>
          <p className="text-sm text-gray-500">Roles are maintained by PigMaster so they stay consistent and safe. Contact support if you need a different role.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {roles.map(role => (
            <div key={role.id} className="rounded-xl border p-4 dark:border-gray-700">
              <p className="font-medium">{role.name}</p>
              {role.description && <p className="mt-0.5 text-xs text-gray-500">{role.description}</p>}
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {summarisePermissions(role.permissions).map(line => (
                  <li key={line} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-200">{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>They get an email to set a password, then they can sign in and open this farm.</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Full name</Label>
                <Input id="invite-name" required minLength={2} value={invite.name} onChange={event => setInvite({ ...invite, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-phone">Phone (optional)</Label>
                <Input id="invite-phone" type="tel" placeholder="+254712345678" value={invite.phone} onChange={event => setInvite({ ...invite, phone: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" required value={invite.email} onChange={event => setInvite({ ...invite, email: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                required
                value={invite.farm_role_id}
                onChange={event => setInvite({ ...invite, farm_role_id: event.target.value })}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="" disabled>Choose a role…</option>
                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              {selectedRole && (
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
                  <p className="font-medium">{selectedRole.description}</p>
                  <p className="mt-1">{summarisePermissions(selectedRole.permissions).join(" · ")}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={open => !open && setRemoving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>They will lose access to this farm straight away. Records they created stay on the farm.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
