"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star } from "lucide-react"
import { useSubscription } from "@/lib/subscription-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PaymentModal from "./payment-modal"
import { calculateAnnualPrice, getSavePercent } from "@/lib/utils"

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
        period: "monthly",
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
        period: "monthly",
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

export default function PricingPage() {
    const { tier, upgradeTo } = useSubscription()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; period: string } | null>(null)
    const [showPayment, setShowPayment] = useState(false)

    const handleSelectPlan = (planId: string) => {
        const plan = plans.find(p => p.id === planId)!
        let price: number
        let period: string

        if (planId === "free") {
            price = 0
            period = "forever"
            upgradeTo("free")
            return
        } else {
            period = billingCycle
            price = billingCycle === 'monthly' ? plan.price : calculateAnnualPrice(plan.price)
        }

        setSelectedPlan({ id: planId, name: plan.name, price, period })
        setShowPayment(true)
    }

    const handlePaymentSuccess = (planId: string) => {
        upgradeTo(planId as any)
        setShowPayment(false)
        setSelectedPlan(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Scale your pig farm management with the right plan for your needs. Start free and upgrade as you grow.
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Current Plan: {tier.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                {/* Billing Cycle Toggle */}
                <Tabs defaultValue="monthly" onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-full">
                    <TabsList className="grid w-[300px] grid-cols-2 mx-auto">
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly (save {getSavePercent()}%)</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                        const Icon = plan.icon
                        const isCurrentPlan = tier === plan.id
                        const isUpgrade = plan.id !== "free" && (tier === "free" || (tier === "standard" && plan.id === "advanced"))
                        const isFree = plan.id === 'free'
                        const baseMonthly = plan.price
                        const displayPrice = isFree ? 0 : (billingCycle === 'monthly' ? baseMonthly : calculateAnnualPrice(baseMonthly))
                        const displayPeriod = isFree ? 'forever' : billingCycle
                        const savePercent = !isFree && billingCycle === 'yearly' ? getSavePercent() : 0

                        return (
                            <Card
                                key={plan.id}
                                className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${plan.popular ? "ring-2 ring-blue-500 scale-105" : ""
                                    } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                                    </div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute -top-4 right-4">
                                        <Badge className="bg-green-500 text-white px-3 py-1">Current Plan</Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-8">
                                    <div
                                        className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}
                                    >
                                        <Icon className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    <div className="space-y-2">
                                        <div className="flex items-baseline justify-center space-x-1">
                                            <span className="text-4xl font-bold">${displayPrice.toFixed(2)}</span>
                                            <span className="text-gray-600 dark:text-gray-300">/{displayPeriod}</span>
                                        </div>
                                        {savePercent > 0 && (
                                            <p className="text-sm text-green-600">Save {savePercent}% compared to monthly</p>
                                        )}
                                        <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Features */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-green-700 dark:text-green-400">✓ Included Features</h4>
                                        {plan.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Limitations */}
                                    {plan.limitations.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-500 dark:text-gray-400">Limitations</h4>
                                            {plan.limitations.map((limitation, index) => (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">{limitation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3 ${isCurrentPlan
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : plan.popular
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : "bg-gray-800 hover:bg-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                            }`}
                                    >
                                        {isCurrentPlan ? "Current Plan" : isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl">Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        We accept M-Pesa, Stripe (credit/debit cards), and PayPal for your convenience.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Is there a free trial?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Our Free plan is available forever with no time limits. Upgrade when you're ready to scale.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Do you offer refunds?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && selectedPlan && (
                <PaymentModal
                    plan={selectedPlan}
                    onSuccess={() => handlePaymentSuccess(selectedPlan.id)}
                    onClose={() => setShowPayment(false)}
                />
            )}
        </div>
    )
}
