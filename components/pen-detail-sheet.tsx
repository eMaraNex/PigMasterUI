"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowRightLeft, ChevronRight, History, Loader2, LogIn, LogOut, MoreVertical, PiggyBank, Plus, Search, Wheat } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import RemovePigDialog from "@/components/remove-pig-dialog";
import TransferPigDialog from "@/components/transfer-pig-dialog";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/lib/permissions";
import type { Pen, Pig } from "@/types";

dayjs.extend(relativeTime);

type PenPig = Pig & { id: string; in_pen_since?: string | null };
type HistoryRow = {
  id: string; pig_id: string; pig_uuid: string | null; pig_name: string | null; gender: string | null;
  assigned_at: string; removed_at: string | null; removal_reason: string | null; removal_notes: string | null;
};
type PenProfile = {
  pen: { id: string; name: string; level: string; position: number; size?: string; material?: string; features?: string[]; row_name?: string };
  pigs: PenPig[];
  history: HistoryRow[];
  feeding_30d: { feeds: number; kg: number; last_fed: string | null };
  counts: { pigs: number; sows: number; boars: number; pregnant: number; sick: number };
};

const pretty = (value?: string | null) => (value ? value.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : "");
const ageLabel = (birth?: string | null) => {
  if (!birth) return null;
  const days = dayjs().diff(dayjs(birth), "day");
  return days < 60 ? `${days}d` : days < 730 ? `${Math.floor(days / 30.4)}mo` : `${Math.floor(days / 365)}y`;
};

/**
 * Side panel for one pen: who is in it (searchable, so a pen of 10+ weaners stays easy
 * to scan), quick actions per pig, and every pig that has moved in or out.
 */
export default function PenDetailSheet({ penId, pens, onClose, onAddPig, onChanged }: {
  penId: string | null;
  pens: Pen[];
  onClose: () => void;
  onAddPig: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [profile, setProfile] = useState<PenProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<PenPig | null>(null);
  const [moving, setMoving] = useState<PenPig | null>(null);

  const load = useCallback(() => {
    if (!penId) return;
    setLoading(true);
    apiRequest.get(`/pens/profile/${penId}`)
      .then(response => setProfile(response.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [penId]);

  useEffect(() => { setProfile(null); setSearch(""); load(); }, [load]);

  const pigs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = profile?.pigs ?? [];
    return term ? list.filter(pig => `${pig.pig_id} ${pig.name ?? ""} ${pig.breed ?? ""}`.toLowerCase().includes(term)) : list;
  }, [profile, search]);

  const events = useMemo(() => (profile?.history ?? []).flatMap(row => [
    ...(row.removed_at ? [{ key: `${row.id}-out`, row, date: row.removed_at, out: true }] : []),
    { key: `${row.id}-in`, row, date: row.assigned_at, out: false },
  ]).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()), [profile]);

  const changed = () => { load(); onChanged(); };
  const openPig = (id?: string | null) => id && router.push(`/pigs/${id}`);

  return (
    <>
      <Sheet open={Boolean(penId)} onOpenChange={open => !open && onClose()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50 p-5 text-left dark:border-gray-700 dark:from-green-950/40 dark:to-blue-950/40">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <PiggyBank className="h-5 w-5 text-green-600" />Pen {profile?.pen.name ?? ""}
            </SheetTitle>
            <SheetDescription>
              {profile ? `${profile.pen.row_name ?? ""} row · level ${profile.pen.level} · position ${profile.pen.position}` : "Loading…"}
            </SheetDescription>
            {profile && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                <Badge className={profile.counts.pigs ? "bg-green-600 hover:bg-green-600" : ""} variant={profile.counts.pigs ? "default" : "secondary"}>
                  {profile.counts.pigs ? `${profile.counts.pigs} pig${profile.counts.pigs === 1 ? "" : "s"}` : "Empty"}
                </Badge>
                {profile.counts.sows > 0 && <Badge variant="outline" className="bg-white/70 dark:bg-gray-900/50">♀ {profile.counts.sows} female</Badge>}
                {profile.counts.boars > 0 && <Badge variant="outline" className="bg-white/70 dark:bg-gray-900/50">♂ {profile.counts.boars} male</Badge>}
                {profile.counts.pregnant > 0 && <Badge className="bg-pink-500 hover:bg-pink-500">{profile.counts.pregnant} pregnant</Badge>}
                {profile.counts.sick > 0 && <Badge variant="destructive">{profile.counts.sick} sick</Badge>}
              </div>
            )}
          </SheetHeader>

          {loading && !profile ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : profile && (
            <Tabs defaultValue="pigs" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-4 grid grid-cols-2">
                <TabsTrigger value="pigs">Pigs ({profile.counts.pigs})</TabsTrigger>
                <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />History ({profile.history.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pigs" className="mt-0 flex min-h-0 flex-1 flex-col">
                <div className="space-y-3 px-5 pt-4">
                  <div className="flex items-center gap-2 rounded-xl border bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-gray-700 dark:bg-amber-900/20 dark:text-amber-100">
                    <Wheat className="h-4 w-4 shrink-0" />
                    {profile.feeding_30d.feeds
                      ? `${profile.feeding_30d.kg} kg fed in the last 30 days · last fed ${dayjs(profile.feeding_30d.last_fed).fromNow()}`
                      : "No feeding recorded for this pen in the last 30 days"}
                  </div>
                  {profile.pigs.length > 6 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find by tag, name or breed" className="pl-9" />
                    </div>
                  )}
                </div>
                <ul className="mt-3 min-h-0 flex-1 divide-y overflow-y-auto px-2 dark:divide-gray-700">
                  {pigs.map(pig => {
                    const female = pig.gender === "female";
                    return (
                      <li key={pig.id} className="flex items-center gap-2 px-3 py-2.5">
                        <button type="button" onClick={() => openPig(pig.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:opacity-80">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${female ? "bg-pink-500" : "bg-blue-500"}`}>{female ? "♀" : "♂"}</span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              <span className="truncate">{pig.pig_id}</span>
                              {pig.name && <span className="truncate font-normal text-gray-500">· {pig.name}</span>}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {[pig.breed, ageLabel(pig.birth_date), pig.weight ? `${pig.weight} kg` : null, pig.in_pen_since ? `here since ${dayjs(pig.in_pen_since).format("D MMM")}` : null].filter(Boolean).join(" · ")}
                            </span>
                            <span className="mt-0.5 flex gap-1">
                              {pig.is_pregnant && <Badge className="h-4 bg-pink-500 px-1.5 text-[10px] hover:bg-pink-500">Pregnant</Badge>}
                              {["sick", "quarantine"].includes(String(pig.status)) && <Badge variant="destructive" className="h-4 px-1.5 text-[10px] capitalize">{pig.status}</Badge>}
                            </span>
                          </span>
                        </button>
                        {(can("pigs", "update") || can("pigs", "delete")) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions for ${pig.pig_id}`}><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openPig(pig.id)}>Open profile</DropdownMenuItem>
                              {can("pigs", "update") && <DropdownMenuItem onClick={() => setMoving(pig)}><ArrowRightLeft className="mr-2 h-4 w-4" />Move to another pen</DropdownMenuItem>}
                              {can("pigs", "delete") && <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setRemoving(pig)}><LogOut className="mr-2 h-4 w-4" />Sold / died / culled</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                      </li>
                    );
                  })}
                  {profile.pigs.length === 0 && <li className="py-12 text-center text-sm text-gray-500">This pen is empty.</li>}
                  {profile.pigs.length > 0 && pigs.length === 0 && <li className="py-8 text-center text-sm text-gray-500">No pig matches &quot;{search}&quot;.</li>}
                </ul>
                {can("pigs", "create") && (
                  <div className="border-t p-4 dark:border-gray-700">
                    <Button onClick={onAddPig} className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"><Plus className="mr-2 h-4 w-4" />Add pig to this pen</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {events.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">No pigs have moved in or out yet.</p> : (
                  <ol className="relative space-y-4 border-l border-gray-200 pl-6 dark:border-gray-700">
                    {events.map(({ key, row, date, out }) => (
                      <li key={key} className="relative">
                        <span className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-950 ${out ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {out ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                        </span>
                        <button type="button" onClick={() => openPig(row.pig_uuid)} className="text-left text-sm font-medium hover:underline">
                          {row.pig_id}{row.pig_name ? ` · ${row.pig_name}` : ""} {out ? `left: ${pretty(row.removal_reason) || "removed"}` : "moved in"}
                        </button>
                        <p className="text-xs text-gray-500">{dayjs(date).format("D MMM YYYY")}{out && row.removal_notes ? ` · ${row.removal_notes}` : ""}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {removing && (
        <RemovePigDialog
          pen_name={profile?.pen.name}
          pen_id={profile?.pen.id}
          pig={removing}
          onClose={() => setRemoving(null)}
          onRemovalSuccess={() => { setRemoving(null); changed(); }}
        />
      )}
      {moving && user?.farm_id && (
        <TransferPigDialog
          isOpen
          onClose={() => setMoving(null)}
          pigId={moving.id}
          pigName={moving.name || moving.pig_id || ""}
          farmId={user.farm_id}
          currentPenId={profile?.pen.id}
          currentPenName={profile?.pen.name}
          pens={pens}
          onTransferSuccess={() => { setMoving(null); changed(); }}
        />
      )}
    </>
  );
}
