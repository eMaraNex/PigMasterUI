"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star, ArrowLeft } from "lucide-react"
import PaymentModal from "@/components/subscription/payment-modal"
import ProtectedRoute from "@/components/auth/protected-route"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/lib/subscription-context"

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

function PricingContent() {
    const router = useRouter()
    const { tier, upgradeTo } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [showPayment, setShowPayment] = useState(false)

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
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="p-2 touch:p-3 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="ml-2 hidden sm:inline">Back</span>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Choose Your Plan
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2 max-w-3xl mx-auto">
                            Scale your pig farm management with the right plan for your needs. Start free and upgrade as you grow.
                        </p>
                        <div className="flex items-center justify-center mt-4">
                            <Badge
                                variant="outline"
                                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs sm:text-sm"
                            >
                                Current Plan: {tier.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <div className="w-8 sm:w-10" /> {/* Spacer for alignment */}
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
                                        <div className="flex items-baseline justify-center space-x-1">
                                            <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">${plan.price}</span>
                                            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">/{plan.period}</span>
                                        </div>
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
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-center text-xl sm:text-2xl text-gray-900 dark:text-gray-100">Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 px-4 sm:px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2">Can I change plans anytime?</h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2">What payment methods do you accept?</h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        We accept M-Pesa, Stripe (credit/debit cards), and PayPal for your convenience.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2">Is there a free trial?</h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Our Free plan is available forever with no time limits. Upgrade when you're ready to scale.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2">Do you offer refunds?</h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
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
                    plan={plans.find((p) => p.id === selectedPlan)!}
                    onSuccess={() => handlePaymentSuccess(selectedPlan)}
                    onClose={() => setShowPayment(false)}
                />
            )}
        </div>
    )
}

export default function PricingPage() {
    return (
        <ProtectedRoute>
            <PricingContent />
        </ProtectedRoute>
    )
}