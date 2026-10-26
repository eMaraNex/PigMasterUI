"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { CalendarClock, CheckCircle2, Clock, Crown, Loader2, Receipt, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useSubscription } from "@/lib/subscription-context";

type Payment = {
  id: string;
  plan: string;
  amount: string | number;
  currency: string;
  status: "pending" | "success" | "failed" | "cancelled";
  mpesa_receipt_number: string | null;
  phone_number: string | null;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
  metadata?: { plan_period?: string } | null;
};

const STATUS: Record<Payment["status"], { label: string; icon: typeof CheckCircle2; tone: string }> = {
  success: { label: "Paid", icon: CheckCircle2, tone: "text-emerald-600" },
  pending: { label: "Pending", icon: Clock, tone: "text-amber-600" },
  failed: { label: "Failed", icon: XCircle, tone: "text-red-600" },
  cancelled: { label: "Cancelled", icon: XCircle, tone: "text-gray-500" },
};

const PAGE_SIZE = 10;

/** 254712345678 -> 0712 •••678: enough for the owner to recognise the number, not to copy it. */
const maskPhone = (phone: string | null) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) return "—";
  const local = `0${digits.slice(-9)}`;
  return `${local.slice(0, 4)} •••${local.slice(-3)}`;
};

/** Current plan, renewal date and M-Pesa payment history for the farm owner. */
export default function BillingSettings() {
  const router = useRouter();
  const { ready, tier, isTrialActive, trialDaysLeft, trialEndsAt, subscriptionEndsAt, isFarmOwner } = useSubscription();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFarmOwner) return;
    setLoading(true);
    apiRequest.get("/payments", { params: { page, limit: PAGE_SIZE } })
      .then(response => { setPayments(response.data.data); setTotal(response.data.total); })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [page, isFarmOwner]);

  if (!isFarmOwner) {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardContent className="py-10 text-center text-sm text-gray-600 dark:text-gray-300">
          Billing is managed by the farm owner. Your access follows the farm&apos;s plan.
        </CardContent>
      </Card>
    );
  }

  const daysToRenewal = subscriptionEndsAt ? dayjs(subscriptionEndsAt).diff(dayjs(), "day") : null;
  const planName = isTrialActive ? "Free trial" : `${tier.charAt(0).toUpperCase()}${tier.slice(1)} plan`;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/70">
        <div className="bg-gradient-to-r from-violet-600 to-blue-600 p-5 text-white">
          {!ready ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm text-white/80"><Crown className="h-4 w-4" />Current plan</p>
                <p className="mt-1 text-2xl font-bold">{planName}</p>
                <p className="mt-1 text-sm text-white/85">
                  {isTrialActive && trialEndsAt && `${trialDaysLeft} days left · ends ${dayjs(trialEndsAt).format("D MMM YYYY")}`}
                  {!isTrialActive && subscriptionEndsAt && `Renews or expires on ${dayjs(subscriptionEndsAt).format("D MMM YYYY")}`}
                  {!isTrialActive && !subscriptionEndsAt && "Basic features only. Upgrade to unlock breeding, reports and more."}
                </p>
              </div>
              <Button onClick={() => router.push("/pricing")} className="bg-white text-violet-700 hover:bg-white/90">
                {tier === "free" || isTrialActive ? "Upgrade" : "Renew or change plan"}
              </Button>
            </div>
          )}
        </div>
        {daysToRenewal !== null && daysToRenewal <= 7 && !isTrialActive && (
          <div className="flex items-center gap-2 border-t bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:border-gray-700 dark:bg-amber-900/20 dark:text-amber-200">
            <CalendarClock className="h-4 w-4" />
            Your plan ends in {Math.max(daysToRenewal, 0)} day{daysToRenewal === 1 ? "" : "s"}. Renew now to avoid losing access.
          </div>
        )}
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Receipt className="h-5 w-5 text-gray-500" />Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-gray-500">
                  <tr><th className="pb-2">Date</th><th className="pb-2">Plan</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">M-Pesa receipt</th><th className="hidden pb-2 md:table-cell">Paid from</th></tr>
                </thead>
                <tbody>
                  {payments.map(payment => {
                    const status = STATUS[payment.status];
                    const Icon = status.icon;
                    return (
                      <tr key={payment.id} className="border-t dark:border-gray-700">
                        <td className="whitespace-nowrap py-2.5">{dayjs(payment.created_at).format("D MMM YYYY")}</td>
                        <td className="py-2.5 capitalize">{payment.plan}<span className="block text-xs text-gray-500">{payment.metadata?.plan_period === "yearly" ? "Yearly" : "Monthly"}</span></td>
                        <td className="whitespace-nowrap py-2.5">{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 ${status.tone}`} title={payment.failure_reason ?? undefined}>
                            <Icon className="h-4 w-4" />{status.label}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-xs">{payment.mpesa_receipt_number ?? "—"}</td>
                        <td className="hidden py-2.5 text-xs text-gray-500 md:table-cell">{maskPhone(payment.phone_number)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {total > PAGE_SIZE && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{total} payments</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500"><Badge variant="outline" className="mr-1">Tip</Badge>Payments are confirmed by M-Pesa; a pending payment updates automatically within a few minutes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
