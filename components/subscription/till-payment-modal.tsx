"use client"

import { useState } from "react"
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, Loader2, Check, AlertCircle, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as utils from "@/lib/utils"

// Replace these with your real business details before going live.
const TILL_NUMBER = "5570016"
const BUSINESS_NAME = "Emaranex Enterprise"
const WHATSAPP_NUMBER = "254711985548" // international format, no + or spaces

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

export default function TillPaymentModal({ plan, onClose, onSuccess }: TillPaymentModalProps) {
    const [step, setStep] = useState<"form" | "pending">("form")
    const [submitting, setSubmitting] = useState(false)
    const [accountName, setAccountName] = useState("")
    const [mpesaCode, setMpesaCode] = useState("")
    const { toast } = useToast()

    const isFormValid = accountName.trim().length > 0 && mpesaCode.trim().length > 0

    const copyTillNumber = async () => {
        try {
            await navigator.clipboard.writeText(TILL_NUMBER)
            toast({ title: "Till number copied" })
        } catch {
            // clipboard API can fail on non-secure contexts; fail silently, number is visible anyway
        }
    }

    const handleSubmit = async () => {
        if (!isFormValid) return
        setSubmitting(true)
        try {
            const token = localStorage.getItem("pig_farm_token")

            // Log the pending manual payment so it shows up in your admin/verification queue.
            // Requires a backend endpoint that accepts this shape — adjust the path/payload to match yours.
            // await axios.post(
            //     `${utils.apiUrl}/payments/manual`,
            //     {
            //         plan: plan.id,
            //         tier: plan.name,
            //         amount: plan.price,
            //         currency: "USD",
            //         payment_mode: "till",
            //         status: "pending_verification",
            //         metadata: {
            //             account_name: accountName,
            //             mpesa_code: mpesaCode,
            //             till_number: TILL_NUMBER,
            //         },
            //     },
            //     { headers: { Authorization: `Bearer ${token}` } }
            // )

            const message =
                `Hi, I just paid for the ${plan.name} plan ($${plan.price.toFixed(2)}).\n` +
                `Name/email: ${accountName}\n` +
                `M-Pesa code: ${mpesaCode}`
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, "_blank")

            setStep("pending")
        } catch (error) {
            console.error("Manual payment log error:", error)
            const errorMessage = error instanceof Error ? error.message : "Couldn't log your payment"
            toast({
                variant: "destructive",
                title: "Something went wrong",
                description: errorMessage,
                action: <Button size="sm" onClick={() => setSubmitting(false)}>Retry</Button>,
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
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

                {step === "form" ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Till number</span>
                                <button
                                    onClick={copyTillNumber}
                                    className="flex items-center gap-1 text-sm font-semibold tracking-wide"
                                >
                                    {TILL_NUMBER}
                                    <Copy className="h-3 w-3 text-gray-400" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Business name</span>
                                <span className="text-sm font-medium">{BUSINESS_NAME}</span>
                            </div>
                        </div>

                        <ol className="text-sm text-gray-500 list-decimal pl-5 space-y-1">
                            <li>Go to the M-Pesa menu</li>
                            <li>Select Lipa na M-Pesa, then Buy goods</li>
                            <li>Enter the till number and amount</li>
                            <li>Enter your PIN to confirm</li>
                        </ol>

                        <div className="space-y-2">
                            <Label htmlFor="accountName">Your name or account email</Label>
                            <Input
                                id="accountName"
                                placeholder="Jane Wanjiru"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mpesaCode">M-Pesa confirmation code</Label>
                            <Input
                                id="mpesaCode"
                                placeholder="QGH7X9K2LM"
                                value={mpesaCode}
                                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                            />
                            {!isFormValid && (accountName || mpesaCode) && (
                                <div className="flex items-center text-red-500 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Both fields are required
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !isFormValid}
                            className="w-full"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Send confirmation via WhatsApp
                                </>
                            )}
                        </Button>

                        <p className="text-center text-xs text-gray-500">
                            We'll activate your account once we verify the payment.
                        </p>
                    </div>
                ) : (
                    <div className="text-center space-y-4 py-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold">Sent for verification</p>
                            <p className="text-sm text-gray-500 mt-1">
                                We've received your confirmation code. Your {plan.name} plan will be activated
                                shortly after we verify the payment.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => onSuccess(plan.id)}>
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}