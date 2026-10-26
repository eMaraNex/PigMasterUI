"use client"

import { useState, useEffect, useRef } from "react"
import { apiRequest as axios } from "@/lib/api/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle, Smartphone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as utils from "@/lib/utils"

// Customers may first see a Fuliza offer and then the PIN screen, which can take a few
// minutes. The server never calls a payment failed before ~3 minutes unless the customer
// cancels, so the modal waits a little longer and then keeps checking quietly.
const POLL_INTERVAL_MS = 3000
const ACTIVE_WAIT_MS = 4 * 60_000
const BACKGROUND_POLL_MS = 15_000
const BACKGROUND_WAIT_MS = 10 * 60_000

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

type Step = "form" | "waiting" | "processing" | "success" | "failed"

export default function TillPaymentModal({ plan, onClose, onSuccess }: TillPaymentModalProps) {
    const [step, setStep] = useState<Step>("form")
    const [phoneNumber, setPhoneNumber] = useState("+254")
    const [submitting, setSubmitting] = useState(false)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState("")
    const { toast } = useToast()

    const pollRef = useRef<NodeJS.Timeout | null>(null)
    const startedAt = useRef(0)
    const [elapsed, setElapsed] = useState(0)

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
        if (pollRef.current) clearTimeout(pollRef.current)
        pollRef.current = null
    }

    useEffect(() => () => stopPolling(), [])

    const finishSuccess = () => {
        stopPolling()
        setStep("success")
        setTimeout(() => {
            window.location.reload()
            onSuccess(plan.id)
        }, 1500)
    }

    /**
     * Polls the payment until M-Pesa gives a definitive answer. Only the server decides
     * "failed"; running out of time here never does, because the customer may still be
     * finishing on the phone (Fuliza, PIN) and a late confirmation still activates the plan.
     */
    const startPolling = (id: string) => {
        startedAt.current = Date.now()
        const tick = async () => {
            const waited = Date.now() - startedAt.current
            setElapsed(waited)
            try {
                const res = await axios.get(`${utils.apiUrl}/payments/${id}`)
                const payment = res.data?.data
                if (payment?.status === "success" || payment?.mpesa_receipt_number) return finishSuccess()
                if (payment?.status === "failed") {
                    stopPolling()
                    setStatusMessage(payment?.failure_reason || "M-Pesa did not complete the payment.")
                    setStep("failed")
                    return
                }
            } catch (err) {
                // Network blips: keep checking.
                console.warn("Poll error:", err)
            }
            if (waited > ACTIVE_WAIT_MS + BACKGROUND_WAIT_MS) return stopPolling()
            if (waited > ACTIVE_WAIT_MS) setStep(current => (current === "waiting" ? "processing" : current))
            pollRef.current = setTimeout(tick, waited > ACTIVE_WAIT_MS ? BACKGROUND_POLL_MS : POLL_INTERVAL_MS)
        }
        pollRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    const handleSubmit = async () => {
        if (!isPhoneValid) return
        setSubmitting(true)

        try {
            const normalizedPhone = phoneNumber.replace("+", "") // 254...
            const quoteResponse = await axios.get(`${utils.apiUrl}/payments/quote`, {
                params: { plan: plan.id, period: plan.period === "yearly" ? "yearly" : "monthly" },
            })
            const quote = quoteResponse.data?.data
            if (!quote || typeof quote.amount !== "number" || !quote.currency) {
                throw new Error("The server returned an invalid payment quote.")
            }

            const payload = {
                plan: plan.id,
                amount: quote.amount,
                currency: quote.currency,
                payment_mode: "mpesa",
                phone_number: normalizedPhone,
                tier: plan.name,
                metadata: {
                    plan_period: plan.period === "yearly" ? "yearly" : "monthly", // ← fix here
                    initiated_from: "till_modal",
                    subscription_startdate: startDate.toISOString().split("T")[0],
                    subscription_enddate: endDate.toISOString().split("T")[0],
                    duration_months: quote.durationMonths,
                },
            }

            const res = await axios.post(`${utils.apiUrl}/payments`, payload, {
                headers: { "Idempotency-Key": crypto.randomUUID() },
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
                        <p className="font-semibold">Waiting for M-Pesa…</p>
                        <p className="text-sm text-gray-500">
                            Check your phone for the M-Pesa prompt and enter your PIN to confirm.
                        </p>
                        {elapsed > 20_000 && (
                            <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                                If M-Pesa offers Fuliza, accept it and then enter your PIN. Take your time; we keep waiting for M-Pesa&apos;s answer.
                            </p>
                        )}
                        <Button variant="outline" className="w-full" onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                )}

                {/* ── STILL PROCESSING ── */}
                {step === "processing" && (
                    <div className="text-center space-y-4 py-6">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto" />
                        <p className="font-semibold">Still waiting for M-Pesa to confirm</p>
                        <p className="text-sm text-gray-500">
                            If you completed the payment on your phone, your plan activates automatically as soon as M-Pesa confirms it.
                            You can close this window; please don&apos;t pay again.
                        </p>
                        <Button variant="outline" className="w-full" onClick={handleClose}>
                            Close
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
                        <p className="font-semibold">Payment not completed</p>
                        <p className="text-sm text-gray-500">{statusMessage}</p>
                        <p className="text-xs text-gray-500">
                            If M-Pesa did take the money, your plan still activates automatically once M-Pesa confirms it. Check Settings → Billing before paying again.
                        </p>
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