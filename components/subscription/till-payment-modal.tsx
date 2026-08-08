"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle, Smartphone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as utils from "@/lib/utils"

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 120_000 // 2 minutes

interface TillPaymentModalProps {
    plan: {
        id: string
        name: string
        price: number
        period: string
    }
    onSuccess: (planId: string) => void
    onClose: () => void
}

type Step = "form" | "waiting" | "success" | "failed"

export default function TillPaymentModal({ plan, onClose, onSuccess }: TillPaymentModalProps) {
    const [step, setStep] = useState<Step>("form")
    const [phoneNumber, setPhoneNumber] = useState("+254")
    const [submitting, setSubmitting] = useState(false)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState("")
    const { toast } = useToast()

    const pollRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const isPhoneValid = /^\+2547\d{8}$/.test(phoneNumber) || /^\+2541\d{8}$/.test(phoneNumber)

    // Compute amount + dates
    const startDate = new Date()
    const endDate = new Date(startDate)
    if (plan.period === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
        endDate.setMonth(endDate.getMonth() + 1)
    }

    const stopPolling = () => {
        if (pollRef.current) clearInterval(pollRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    useEffect(() => () => stopPolling(), [])

    const startPolling = (id: string) => {
        const token = localStorage.getItem("pig_farm_token")

        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`${utils.apiUrl}/payments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const payment = res.data?.data

                if (payment?.status === "success") {
                    stopPolling()
                    setStep("success")
                    setTimeout(() => onSuccess(plan.id), 1500)
                } else if (payment?.status === "failed") {
                    // Only show failed if there's NO receipt — if there's a receipt,
                    // money was taken but activation failed, treat as success
                    if (payment?.metadata?.mpesa_receipt) {
                        stopPolling()
                        setStep("success")
                        setTimeout(() => onSuccess(plan.id), 1500)
                    } else {
                        stopPolling()
                        setStatusMessage(
                            payment?.metadata?.callback_error || "Payment was declined or cancelled."
                        )
                        setStep("failed")
                    }
                }
            } catch (err) {
                console.warn("Poll error:", err)
            }
        }, POLL_INTERVAL_MS)

        timeoutRef.current = setTimeout(() => {
            stopPolling()
            // Check the step via ref to avoid stale closure
            setStep((current) => {
                if (current === "waiting") {
                    setStatusMessage("Payment timed out. Please try again.")
                    return "failed"
                }
                return current
            })
        }, POLL_TIMEOUT_MS)
    }

    const handleSubmit = async () => {
        if (!isPhoneValid) return
        setSubmitting(true)

        try {
            const token = localStorage.getItem("pig_farm_token")
            const normalizedPhone = phoneNumber.replace("+", "") // 254...

            const payload = {
                plan: plan.id,
                amount: plan.price,
                currency: "KES",
                payment_mode: "mpesa",
                phone_number: normalizedPhone,
                tier: plan.name,
                metadata: {
                    plan_period: plan.period === "yearly" ? "yearly" : "monthly", // ← fix here
                    initiated_from: "till_modal",
                    duration: plan.period === "yearly" ? "1 year" : "1 month",
                    subscription_startdate: startDate.toISOString().split("T")[0],
                    subscription_enddate: endDate.toISOString().split("T")[0],
                    original_amount: plan.price,
                    original_currency: "USD",
                },
            }

            const res = await axios.post(`${utils.apiUrl}/payments`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })

            const created = res.data?.data
            if (!created?.id) throw new Error("No payment ID returned from server")

            setPaymentId(created.id)
            setStep("waiting")
            startPolling(created.id)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not initiate payment"
            toast({ variant: "destructive", title: "Payment error", description: msg })
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        stopPolling()
        onClose()
    }

    return (
        <Dialog open onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Pay with M-Pesa</DialogTitle>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-semibold">{plan.name} Plan</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ${plan.price.toFixed(2)} USD /{plan.period}
                        </p>
                    </div>
                </DialogHeader>

                {/* ── FORM ── */}
                {step === "form" && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg text-sm text-gray-500">
                            Enter your Safaricom number and we'll send you an M-Pesa prompt to complete the payment.
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">M-Pesa phone number</Label>
                            <Input
                                id="phone"
                                placeholder="+254 7XX XXX XXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.trim())}
                            />
                            {phoneNumber.length > 4 && !isPhoneValid && (
                                <div className="flex items-center text-red-500 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Enter a valid Kenyan number (+2547… or +2541…)
                                </div>
                            )}
                        </div>

                        <Button onClick={handleSubmit} disabled={submitting || !isPhoneValid} className="w-full">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending prompt…
                                </>
                            ) : (
                                <>
                                    <Smartphone className="mr-2 h-4 w-4" />
                                    Send M-Pesa prompt
                                </>
                            )}
                        </Button>

                        <p className="text-center text-xs text-gray-500">
                            Your plan will activate automatically once payment is confirmed.
                        </p>
                    </div>
                )}

                {/* ── WAITING ── */}
                {step === "waiting" && (
                    <div className="text-center space-y-4 py-6">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
                        <p className="font-semibold">Waiting for payment…</p>
                        <p className="text-sm text-gray-500">
                            Check your phone for the M-Pesa prompt and enter your PIN to confirm.
                        </p>
                        <Button variant="outline" className="w-full" onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {step === "success" && (
                    <div className="text-center space-y-4 py-6">
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="font-semibold">Payment confirmed!</p>
                        <p className="text-sm text-gray-500">Your {plan.name} plan is now active.</p>
                    </div>
                )}

                {/* ── FAILED ── */}
                {step === "failed" && (
                    <div className="text-center space-y-4 py-6">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <p className="font-semibold">Payment failed</p>
                        <p className="text-sm text-gray-500">{statusMessage}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={handleClose}>
                                Close
                            </Button>
                            <Button className="flex-1" onClick={() => setStep("form")}>
                                Try again
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}