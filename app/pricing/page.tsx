"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star } from "lucide-react"
import PageShell from "@/components/shared/page-shell"
import Link from "next/link"
import FaqList from "@/components/faq/faq-list"
import { PRICING_FAQS } from "@/lib/faqs"
import ProtectedRoute from "@/components/auth/protected-route"
import { useSubscription } from "@/lib/subscription-context"
import TillPaymentModal from "@/components/subscription/till-payment-modal";

const plans = [
    {
        id: "free",
        name: "Free",
        price: 0,
        period: "forever",
        description: "Perfect for small farms getting started",
        icon: Star,
        color: "from-gray-500 to-gray-600",
        features: [
            "Up to 3 rows (54 pigs)",
            "Basic record keeping",
            "Basic analytics",
            "View-only reports",
            "Single user access",
            "Community support",
        ],
        limitations: ["No export functionality", "No email notifications", "No SMS alerts", "No calendar integration"],
    },
    {
        id: "standard",
        name: "Standard",
        price: 1,
        period: "month",
        description: "Ideal for growing farms with multiple users",
        icon: Zap,
        color: "from-blue-500 to-blue-600",
        popular: true,
        features: [
            "Up to 10 rows (180 pigs)",
            "Enhanced analytics",
            "Export reports (PDF, Excel)",
            "Email notifications",
            "Weekly email reports",
            "Up to 3 users with roles",
            "Priority support",
        ],
        limitations: ["No SMS notifications", "No calendar integration"],
    },
    {
        id: "advanced",
        name: "Advanced",
        price: 2,
        period: "month",
        description: "Complete solution for large commercial farms",
        icon: Crown,
        color: "from-purple-500 to-purple-600",
        features: [
            "Unlimited rows & pigs",
            "Advanced predictive analytics",
            "All export formats",
            "Email & SMS notifications",
            "Google Calendar integration",
            "Automated weekly/monthly reports",
            "Unlimited users & roles",
            "Automated backups",
            "24/7 priority support",
            "Custom integrations",
        ],
        limitations: [],
    },
]

type Period = "monthly" | "yearly"
type Quote = { amount: number; currency: string; durationMonths: number }
// Matches the server: yearly = 12 months with 16% off (the server is the source of truth for prices).
const YEARLY_DISCOUNT_PCT = 16

const formatKes = (amount: number) => `KSh ${Math.round(amount).toLocaleString("en-KE")}`

/** Price block: monthly price, or the yearly total with its monthly equivalent and saving. */
function PlanPrice({ plan, period, quotes }: { plan: (typeof plans)[number]; period: Period; quotes: Record<string, Quote> }) {
    if (plan.price === 0) {
        return (
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">Free</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">forever</span>
            </div>
        )
    }
    const monthly = quotes[`${plan.id}:monthly`]
    const yearly = quotes[`${plan.id}:yearly`]
    if (!monthly || !yearly) return <div className="mx-auto h-10 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
    if (period === "monthly") {
        return (
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">{formatKes(monthly.amount)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">/ month</span>
            </div>
        )
    }
    const saving = monthly.amount * 12 - yearly.amount
    return (
        <div className="space-y-1">
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">{formatKes(yearly.amount)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">/ year</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="mr-1 text-gray-400 line-through">{formatKes(monthly.amount * 12)}</span>
                ≈ {formatKes(yearly.amount / 12)} / month
            </p>
            {saving > 0 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200">
                    You save {formatKes(saving)}
                </Badge>
            )}
        </div>
    )
}

function PricingContent() {
    const { tier, upgradeTo, isTrialActive } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [showPayment, setShowPayment] = useState(false)
    const [period, setPeriod] = useState<Period>("monthly")
    const [quotes, setQuotes] = useState<Record<string, Quote>>({})

    // Real KES prices for both billing periods, straight from the server.
    useEffect(() => {
        const paid = plans.filter(plan => plan.price > 0)
        Promise.all(paid.flatMap(plan => (["monthly", "yearly"] as Period[]).map(async billing => {
            const response = await apiRequest.get("/payments/quote", { params: { plan: plan.id, period: billing } })
            return [`${plan.id}:${billing}`, response.data.data as Quote] as const
        })))
            .then(entries => setQuotes(Object.fromEntries(entries)))
            .catch(() => setQuotes({}))
    }, [])

    const handleSelectPlan = (planId: string) => {
        if (planId === "free") {
            upgradeTo("free")
            return
        }
        setSelectedPlan(planId)
        setShowPayment(true)
    }

    const handlePaymentSuccess = (planId: string) => {
        upgradeTo(planId as any)
        setShowPayment(false)
        setSelectedPlan(null)
        window.location.reload()
    }

    return (
        <PageShell
            title="Plans & pricing"
            description="Start with a free trial and upgrade as your farm grows. Pay with M-Pesa."
            width="xl"
            actions={
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Current plan: {isTrialActive ? "Trial" : tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Badge>
            }
        >
            <div className="space-y-8">
                {/* Billing period */}
                <div className="flex flex-col items-center gap-2">
                    <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        {(["monthly", "yearly"] as Period[]).map(option => (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={period === option}
                                onClick={() => setPeriod(option)}
                                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${period === option ? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900 dark:text-gray-300"}`}
                            >
                                {option === "monthly" ? "Pay monthly" : "Pay yearly"}
                                {option === "yearly" && (
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${period === "yearly" ? "bg-white/25 text-white" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"}`}>
                                        Save {YEARLY_DISCOUNT_PCT}%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500">
                        {period === "yearly" ? "One M-Pesa payment covers 12 months. Nothing renews automatically." : "Pay each month with M-Pesa. Nothing renews automatically."}
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon
                        const isCurrentPlan = tier === plan.id
                        const isUpgrade =
                            plan.id !== "free" && (tier === "free" || (tier === "standard" && plan.id === "advanced"))

                        return (
                            <Card
                                key={plan.id}
                                className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${plan.popular ? "ring-2 ring-blue-500 scale-105" : ""} ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-1 text-xs sm:text-sm">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute -top-4 right-4">
                                        <Badge className="bg-green-500 dark:bg-green-600 text-white px-3 py-1 text-xs sm:text-sm">
                                            Current Plan
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-6">
                                    <div
                                        className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}
                                    >
                                        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</CardTitle>
                                    <div className="space-y-2">
                                        <PlanPrice plan={plan} period={period} quotes={quotes} />
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{plan.description}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 px-4 sm:px-6">
                                    {/* Features */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400">✓ Included Features</h4>
                                        {plan.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <Check className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Limitations */}
                                    {plan.limitations.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm sm:text-base text-gray-500 dark:text-gray-400">Limitations</h4>
                                            {plan.limitations.map((limitation, index) => (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{limitation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isCurrentPlan}
                                        className={`w-full h-12 touch:h-14 text-sm sm:text-base ${isCurrentPlan
                                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            : plan.popular
                                                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                                : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                                            }`}
                                    >
                                        {isCurrentPlan
                                            ? "Current Plan"
                                            : isUpgrade
                                                ? `Upgrade to ${plan.name}`
                                                : `Switch to ${plan.name}`}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* FAQ Section */}
                <section className="mx-auto max-w-3xl space-y-4" aria-labelledby="pricing-faq">
                    <div className="text-center">
                        <h2 id="pricing-faq" className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Plans & payments FAQ</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            More answers in the <Link href="/faq" className="text-blue-600 underline dark:text-blue-400">help centre</Link>.
                        </p>
                    </div>
                    <FaqList categories={[{ id: "plans", title: "Plans & payments", items: PRICING_FAQS }]} showSearch={false} />
                </section>
            </div>

            {/* Payment Modal */}
            {showPayment && selectedPlan && (
                <TillPaymentModal
                    plan={{ ...plans.find((p) => p.id === selectedPlan)!, period }}
                    onSuccess={() => handlePaymentSuccess(selectedPlan)}
                    onClose={() => setShowPayment(false)}
                />
            )}
        </PageShell>
    )
}

export default function PricingPage() {
    return (
        <ProtectedRoute>
            <PricingContent />
        </ProtectedRoute>
    )
}