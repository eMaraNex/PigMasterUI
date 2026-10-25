"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowRightLeft, Baby, CalendarClock, Heart, HeartPulse, History, Loader2, LogOut, MapPin, Pencil, Scale, Syringe, TrendingUp, Wheat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageShell from "@/components/shared/page-shell";
import EditPigDialog from "@/components/edit-pig-dialog";
import TransferPigDialog from "@/components/transfer-pig-dialog";
import RemovePigDialog from "@/components/remove-pig-dialog";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { usePermissions } from "@/lib/permissions";
import { useGetPensQuery, emptyList } from "@/lib/redux/api";
import type { Pig } from "@/types";

dayjs.extend(relativeTime);

type Row = Record<string, any>;
type Profile = {
  pig: Pig & Row;
  currency: string;
  summary: {
    age_days: number | null; treatments: number; next_health_due: string | null; feed_kg_30d: number;
    litters: number; piglets_born: number; moves: number; income: number;
  };
  health: Row[]; feeding: Row[]; breeding: Row[]; movements: Row[]; transfers: Row[]; earnings: Row[]; removal: Row | null;
};

const fmtDate = (value?: string | null) => (value ? dayjs(value).format("D MMM YYYY") : "—");
const pretty = (value?: string | null) => (value ? value.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : "—");
const age = (days: number | null) => {
  if (days === null) return "—";
  if (days < 60) return `${days} days`;
  const months = Math.floor(days / 30.4);
  return months < 24 ? `${months} months` : `${Math.floor(months / 12)} yr ${months % 12} mo`;
};
const stage = (pig: Row, days: number | null) => {
  if (days === null) return null;
  if (days < 56) return "Piglet";
  if (days < 84) return "Weaner";
  if (days < 140) return "Grower";
  if (days < 200) return "Finisher";
  return pig.gender === "female" ? "Sow" : "Boar";
};

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-gray-500">{children}</p>;
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900">
          <tr>{head.map(label => <th key={label} className="whitespace-nowrap px-3 py-2.5 font-medium">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">{children}</tbody>
      </table>
    </div>
  );
}

/** Full profile of one pig: details, key numbers, and its health, feeding, breeding, moves and exit history. */
export default function PigProfileView({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { formatAmount: formatBase, convertToBaseCurrency } = useCurrency();
  const { data: pens = emptyList() } = useGetPensQuery(user?.farm_id ?? "", { skip: !user?.farm_id });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"edit" | "transfer" | "remove" | null>(null);

  const load = useCallback(() => {
    apiRequest.get(`/pigs/profile/${id}`)
      .then(response => setProfile(response.data.data))
      .catch(err => setError(err?.response?.data?.message ?? "Could not load this pig"));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const money = (amount: number) => formatBase(convertToBaseCurrency(amount, (profile?.currency ?? "KES") as never));

  // One chronological feed of what happened to the pig.
  const timeline = useMemo(() => {
    if (!profile) return [];
    const events: { date: string; icon: typeof Syringe; tone: string; title: string; detail?: string }[] = [];
    for (const h of profile.health) {
      events.push({ date: h.date, icon: Syringe, tone: "bg-emerald-100 text-emerald-700", title: `${pretty(h.type)}: ${h.description}`, detail: h.status === "scheduled" ? "Scheduled" : h.veterinarian ?? undefined });
    }
    for (const b of profile.breeding) {
      events.push({ date: b.mating_date, icon: Heart, tone: "bg-pink-100 text-pink-700", title: `Mated (${b.sow_id === profile.pig.pig_id ? `boar ${b.boar_id}` : `sow ${b.sow_id}`})` });
      if (b.actual_birth_date) events.push({ date: b.actual_birth_date, icon: Baby, tone: "bg-violet-100 text-violet-700", title: `Farrowed ${b.number_of_piglets ?? 0} piglets` });
    }
    for (const t of profile.transfers) {
      events.push({ date: t.transferred_at, icon: ArrowRightLeft, tone: "bg-sky-100 text-sky-700", title: `Moved ${t.from_pen ?? "?"} → ${t.to_pen ?? "?"}`, detail: t.transfer_reason ?? undefined });
    }
    if (profile.removal) {
      events.push({ date: profile.removal.date, icon: LogOut, tone: "bg-red-100 text-red-700", title: `Left the farm: ${pretty(profile.removal.reason)}`, detail: profile.removal.notes ?? undefined });
    }
    if (profile.pig.created_at) events.push({ date: profile.pig.created_at as string, icon: MapPin, tone: "bg-gray-100 text-gray-700", title: "Added to PigMaster" });
    return events.filter(event => event.date).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 40);
  }, [profile]);

  if (error) {
    return (
      <PageShell title="Pig not found" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "All pigs", href: "/pigs" }, { label: "Not found" }]}>
        <Card><CardContent className="py-10 text-center text-sm text-gray-600">{error}</CardContent></Card>
      </PageShell>
    );
  }
  if (!profile) {
    return (
      <PageShell title="Loading pig…" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "All pigs", href: "/pigs" }, { label: "…" }]}>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      </PageShell>
    );
  }

  const { pig, summary } = profile;
  const isSow = pig.gender === "female";
  // Breeding numbers only make sense for adult females (or any female that has farrowed).
  const breedingSow = isSow && (summary.litters > 0 || (summary.age_days ?? 0) >= 200);
  const live = !profile.removal && !["sold", "deceased"].includes(String(pig.status));
  const pigStage = stage(pig, summary.age_days);
  const kpis = [
    { icon: Syringe, label: "Treatments given", value: String(summary.treatments) },
    { icon: CalendarClock, label: "Next health due", value: summary.next_health_due ? dayjs(summary.next_health_due).format("D MMM") : "Nothing due", hint: summary.next_health_due ? dayjs(summary.next_health_due).fromNow() : undefined },
    { icon: Wheat, label: "Feed, last 30 days", value: `${summary.feed_kg_30d} kg`, hint: "share of pen feeding" },
    breedingSow
      ? { icon: Baby, label: "Litters", value: String(summary.litters), hint: `${summary.piglets_born} piglets born` }
      : { icon: ArrowRightLeft, label: "Pen moves", value: String(summary.moves) },
    { icon: TrendingUp, label: "Income from this pig", value: summary.income ? money(summary.income) : "—" },
  ];

  return (
    <PageShell
      title={`${pig.pig_id}${pig.name ? ` · ${pig.name}` : ""}`}
      description={[pigStage, pig.breed, pig.pen_name ? `Pen ${pig.pen_name}` : null].filter(Boolean).join(" · ")}
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "All pigs", href: "/pigs" }, { label: pig.pig_id ?? "Pig" }]}
      backHref="/pigs"
      width="xl"
      actions={live && (
        <>
          {can("pigs", "update") && <Button variant="outline" size="sm" onClick={() => setDialog("edit")}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
          {can("pigs", "update") && <Button variant="outline" size="sm" onClick={() => setDialog("transfer")}><ArrowRightLeft className="mr-1.5 h-4 w-4" />Move pen</Button>}
          {can("pigs", "delete") && <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDialog("remove")}><LogOut className="mr-1.5 h-4 w-4" />Sold / died</Button>}
        </>
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/70">
            <div className={`flex items-center gap-4 p-5 ${isSow ? "bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-900/30" : "bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/40 dark:to-blue-900/30"}`}>
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow ${isSow ? "bg-pink-500" : "bg-blue-500"}`}>{isSow ? "♀" : "♂"}</span>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{pig.pig_id}</p>
                <p className="truncate text-sm text-gray-600 dark:text-gray-300">{pig.name || pigStage || (isSow ? "Female" : "Male")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={live ? "outline" : "destructive"} className="bg-white/70 capitalize dark:bg-gray-900/50">{live ? String(pig.status ?? "active") : pretty(profile.removal?.reason ?? String(pig.status))}</Badge>
                  {pig.is_pregnant && <Badge className="bg-pink-500 hover:bg-pink-500">Pregnant{pig.expected_birth_date ? ` · due ${dayjs(pig.expected_birth_date).format("D MMM")}` : ""}</Badge>}
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <dl className="divide-y text-sm dark:divide-gray-700">
                {[
                  ["Gender", isSow ? "Female" : "Male"],
                  ["Breed", pig.breed],
                  ["Colour", pig.color],
                  ["Born", `${fmtDate(pig.birth_date)} (${age(summary.age_days)})`],
                  ["Weight", pig.weight ? `${pig.weight} kg` : "—"],
                  ["Pen", pig.pen_name ?? "—"],
                  ["Sire / dam", [pig.parent_male_id, pig.parent_female_id].filter(Boolean).join(" / ") || "—"],
                  ["Acquired", pig.acquisition_type ? `${pretty(pig.acquisition_type)}${pig.acquisition_date ? `, ${fmtDate(pig.acquisition_date)}` : ""}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-5 py-2.5">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              {pig.notes && <p className="border-t px-5 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">{pig.notes}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {kpis.map(kpi => (
              <Card key={kpi.label} className="bg-white/80 dark:bg-gray-800/70">
                <CardContent className="p-4">
                  <kpi.icon className="h-4 w-4 text-gray-400" />
                  <p className="mt-2 text-lg font-bold">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  {kpi.hint && <p className="text-[11px] text-gray-400">{kpi.hint}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="timeline">
            <TabsList className="flex w-full justify-start overflow-x-auto bg-white/70 dark:bg-gray-800/70">
              <TabsTrigger value="timeline"><History className="mr-1.5 h-4 w-4" />Timeline</TabsTrigger>
              <TabsTrigger value="health"><HeartPulse className="mr-1.5 h-4 w-4" />Health ({profile.health.length})</TabsTrigger>
              <TabsTrigger value="feeding"><Wheat className="mr-1.5 h-4 w-4" />Feeding</TabsTrigger>
              <TabsTrigger value="breeding"><Baby className="mr-1.5 h-4 w-4" />Breeding ({profile.breeding.length})</TabsTrigger>
              <TabsTrigger value="moves"><MapPin className="mr-1.5 h-4 w-4" />Pens & moves</TabsTrigger>
              <TabsTrigger value="sales"><Scale className="mr-1.5 h-4 w-4" />Sales & exit</TabsTrigger>
            </TabsList>

            <Card className="mt-3 bg-white/80 dark:bg-gray-800/70">
              <CardContent className="p-4 sm:p-5">
                <TabsContent value="timeline" className="mt-0">
                  {timeline.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
                    <ol className="relative space-y-4 border-l border-gray-200 pl-6 dark:border-gray-700">
                      {timeline.map((event, index) => (
                        <li key={index} className="relative">
                          <span className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800 ${event.tone}`}><event.icon className="h-3.5 w-3.5" /></span>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-gray-500">{fmtDate(event.date)}{event.detail ? ` · ${event.detail}` : ""}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </TabsContent>

                <TabsContent value="health" className="mt-0">
                  {profile.health.length === 0 ? <Empty>No health records for this pig.</Empty> : (
                    <Table head={["Date", "Treatment", "Status", "Next due", "Vet"]}>
                      {profile.health.map(h => (
                        <tr key={h.id}>
                          <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(h.date)}</td>
                          <td className="px-3 py-2.5"><div>{h.description}</div><div className="text-xs capitalize text-gray-500">{h.type}</div></td>
                          <td className="px-3 py-2.5"><Badge variant={h.status === "scheduled" ? "secondary" : "outline"} className="capitalize">{h.status}</Badge></td>
                          <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(h.next_due)}</td>
                          <td className="px-3 py-2.5">{h.veterinarian || "—"}</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="feeding" className="mt-0 space-y-3">
                  <p className="text-xs text-gray-500">Feeding is recorded per pen. Each row is a feed given to a pen while this pig was in it, with this pig&apos;s share.</p>
                  {profile.feeding.length === 0 ? <Empty>No feeding recorded for the pens this pig has been in.</Empty> : (
                    <Table head={["When", "Pen", "Feed", "Pen total", "Pigs", "This pig"]}>
                      {profile.feeding.map(f => (
                        <tr key={f.id}>
                          <td className="whitespace-nowrap px-3 py-2.5">{dayjs(f.feeding_time).format("D MMM, HH:mm")}</td>
                          <td className="px-3 py-2.5">{f.pen_name ?? "—"}</td>
                          <td className="px-3 py-2.5">{f.feed_type}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{f.kg} kg</td>
                          <td className="px-3 py-2.5">{f.pigs_count}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium">{f.kg_per_pig} kg</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="breeding" className="mt-0">
                  {profile.breeding.length === 0 ? <Empty>No breeding records.</Empty> : (
                    <Table head={["Mated", isSow ? "Boar" : "Sow", "Due", "Farrowed", "Piglets", "Died"]}>
                      {profile.breeding.map(b => (
                        <tr key={b.id}>
                          <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(b.mating_date)}</td>
                          <td className="px-3 py-2.5">{isSow ? b.boar_id : b.sow_id}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(b.expected_birth_date)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{b.actual_birth_date ? fmtDate(b.actual_birth_date) : <Badge variant="secondary">Pregnant</Badge>}</td>
                          <td className="px-3 py-2.5">{b.number_of_piglets ?? "—"}</td>
                          <td className="px-3 py-2.5">{b.actual_birth_date ? b.piglets_died : "—"}</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="moves" className="mt-0 space-y-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Pens this pig has been in</h3>
                    {profile.movements.length === 0 ? <Empty>No pen history.</Empty> : (
                      <Table head={["Pen", "From", "Until", "Why it left"]}>
                        {profile.movements.map(m => (
                          <tr key={m.id}>
                            <td className="px-3 py-2.5">{m.pen_name ?? "—"}<div className="text-xs text-gray-500">{m.row_name}</div></td>
                            <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(m.assigned_at)}</td>
                            <td className="whitespace-nowrap px-3 py-2.5">{m.removed_at ? fmtDate(m.removed_at) : <Badge variant="outline">Now</Badge>}</td>
                            <td className="px-3 py-2.5">{m.removed_at ? pretty(m.removal_reason) : "—"}{m.removal_notes ? <div className="text-xs text-gray-500">{m.removal_notes}</div> : null}</td>
                          </tr>
                        ))}
                      </Table>
                    )}
                  </div>
                  {profile.transfers.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Transfers</h3>
                      <Table head={["When", "From", "To", "Reason", "By"]}>
                        {profile.transfers.map(t => (
                          <tr key={t.id}>
                            <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(t.transferred_at)}</td>
                            <td className="px-3 py-2.5">{t.from_pen ?? "—"}</td>
                            <td className="px-3 py-2.5">{t.to_pen ?? "—"}</td>
                            <td className="px-3 py-2.5">{pretty(t.transfer_reason)}</td>
                            <td className="px-3 py-2.5">{t.transferred_by ?? "—"}</td>
                          </tr>
                        ))}
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sales" className="mt-0 space-y-5">
                  {profile.removal ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-900/20">
                      <p className="font-semibold text-red-800 dark:text-red-200">Left the farm on {fmtDate(profile.removal.date)}: {pretty(profile.removal.reason)}</p>
                      <p className="mt-1 text-red-700 dark:text-red-300">
                        {[profile.removal.sale_amount ? `Sold for ${money(Number(profile.removal.sale_amount))}` : null,
                          profile.removal.sale_weight ? `${profile.removal.sale_weight} kg` : null,
                          profile.removal.sold_to ? `to ${profile.removal.sold_to}` : null].filter(Boolean).join(" · ")}
                      </p>
                      {profile.removal.notes && <p className="mt-1 text-red-700 dark:text-red-300">{profile.removal.notes}</p>}
                    </div>
                  ) : <p className="text-sm text-gray-600 dark:text-gray-300">This pig is still on the farm.</p>}
                  {profile.earnings.length > 0 && (
                    <Table head={["Date", "Type", "Buyer", "Weight", "Amount"]}>
                      {profile.earnings.map(e => (
                        <tr key={e.id}>
                          <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(e.date)}</td>
                          <td className="px-3 py-2.5">{pretty(e.sale_type ?? e.type)}</td>
                          <td className="px-3 py-2.5">{e.buyer_name ?? "—"}</td>
                          <td className="px-3 py-2.5">{e.weight ? `${e.weight} kg` : "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium">{money(Number(e.amount))}</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>

      {dialog === "edit" && <EditPigDialog pig={pig} onClose={() => setDialog(null)} onUpdate={() => { setDialog(null); load(); }} />}
      {dialog === "transfer" && user?.farm_id && (
        <TransferPigDialog
          isOpen
          onClose={() => setDialog(null)}
          pigId={pig.id!}
          pigName={pig.name || pig.pig_id || ""}
          farmId={user.farm_id}
          currentPenId={pig.pen_id}
          currentPenName={pig.pen_name}
          pens={pens}
          onTransferSuccess={() => { setDialog(null); load(); }}
        />
      )}
      {dialog === "remove" && (
        <RemovePigDialog
          pen_name={pig.pen_name}
          pen_id={pig.pen_id}
          pig={pig}
          onClose={() => setDialog(null)}
          onRemovalSuccess={() => { setDialog(null); router.push("/pigs"); }}
        />
      )}
    </PageShell>
  );
}
