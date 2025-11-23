"use client"

import { useEffect, useState } from "react"
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Smartphone, DollarSign, Loader2, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as utils from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context"; // Import the currency hook

interface PaymentModalProps {
    plan: {
        id: string
        name: string
        price: number
        period: string  // e.g., 'monthly', 'yearly' - already present, we'll use it for duration
    }
    onSuccess: (planId: string) => void
    onClose: () => void
}

// Define payload interface for better typing
interface PaymentPayload {
    plan: string;
    amount: number;
    currency: string;
    payment_mode: string;
    phone_number?: string;
    tier: string;
    metadata: {
        plan_period: string;
        initiated_from: string;
        duration: string;
        subscription_startdate: string;
        subscription_enddate: string;
        original_amount: number;
        original_currency: string;
        [key: string]: any; // Allow dynamic keys for card_details, email, etc.
    };
}

export default function PaymentModal({ plan, onClose, onSuccess }: PaymentModalProps) {
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("mpesa")
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>(plan.period === 'yearly' ? 'yearly' : 'monthly')
    const [paymentData, setPaymentData] = useState({
        // Stripe/Card
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardName: "",
        // M-Pesa
        phoneNumber: "",
        // PayPal
        email: "",
    })
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null) 
    const { toast } = useToast()
    const { convertFromBaseCurrency, convertToBaseCurrency, getCurrencyRates, isLoading: ratesLoading, error: ratesError, currency, getCurrencySymbol } = useCurrency();

    const monthlyPrice = plan.price;
    const yearlyPrice = utils.calculateAnnualPrice(plan.price);
    const currentPrice = selectedPeriod === 'monthly' ? monthlyPrice : yearlyPrice;
    const savePercent = selectedPeriod === 'yearly' ? utils.getSavePercent() : 0;
    const userCurrency = localStorage.getItem('pig_farm_currency') ?? 'KES';
    useEffect(() => {
        if (ratesLoading) return;
        if (getCurrencyRates()[userCurrency]) {
            const converted = convertFromBaseCurrency(currentPrice, userCurrency);
            setConvertedAmount(Math.round(converted)); 
        } else {
            setConvertedAmount(null); 
        }
        if (ratesError) {
            toast({
                variant: "destructive",
                title: "Currency Load Error",
                description: ratesError,
            });
        }
    }, [paymentMethod, currentPrice, selectedPeriod, ratesLoading, ratesError, toast, getCurrencyRates, currency, convertFromBaseCurrency]);

    const handlePayment = async () => {
        setLoading(true)
        try {
            let payloadCurrency = userCurrency;
            let payloadAmount = convertFromBaseCurrency(currentPrice, payloadCurrency);

            if (paymentMethod === 'mpesa') {
                payloadCurrency = 'KES';
                payloadAmount = convertFromBaseCurrency(currentPrice, 'KES');
            }

            const startDate = new Date();
            const endDate = new Date(startDate);
            if (selectedPeriod === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const duration = selectedPeriod === 'monthly' ? '1 month' : '1 year';

            const basePayload: Omit<PaymentPayload, 'phone_number'> = {
                plan: plan.id,
                amount: 1, 
                currency: payloadCurrency, 
                payment_mode: paymentMethod,
                tier: plan.name,
                metadata: { 
                    plan_period: selectedPeriod, 
                    initiated_from: 'client_modal',
                    duration,
                    subscription_startdate: startDateStr,
                    subscription_enddate: endDateStr,
                    original_amount: currentPrice,
                    original_currency: 'USD'
                }
            }

            // Add method-specific fields
            let fullPayload: PaymentPayload = { ...basePayload, metadata: { ...basePayload.metadata } }

            if (paymentMethod === 'mpesa') {
                if (!paymentData.phoneNumber?.startsWith('+254')) {
                    throw new Error('Valid M-Pesa phone number is required')
                }
                fullPayload.phone_number = paymentData.phoneNumber.replace('+', '') // Normalize to 254...
            } else if (paymentMethod === 'stripe') {
                if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardName) {
                    throw new Error('All card details are required')
                }
                fullPayload.metadata.card_details = {
                    number: paymentData.cardNumber.replace(/\s/g, ''), // Strip spaces for mock
                    expiry: paymentData.expiryDate,
                    cvv: paymentData.cvv,
                    name: paymentData.cardName
                }
            } else if (paymentMethod === 'paypal') {
                if (!paymentData.email || !paymentData.email.includes('@')) {
                    throw new Error('Valid PayPal email is required')
                }
                fullPayload.metadata.email = paymentData.email
            }

            // Call API using axios similar to the example
            const token = localStorage.getItem("pig_farm_token")
            const response = await axios.post(
                `${utils.apiUrl}/payments`,
                fullPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            const data = response.data;
            
            toast({ 
                title: "Payment Successful!", 
                description: `Transaction ID: ${data.data?.transaction_id || 'N/A'}` 
            })

            onSuccess(plan.id)
        } catch (error) {
            console.error('Payment error:', error)
            // Cast error to Error to access .message safely
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: errorMessage,
                action: <Button size="sm" onClick={() => setLoading(false)}>Retry</Button>
            })
        } finally {
            setLoading(false)
        }
    }

    // Validation helpers
    const isMpesaValid = paymentData.phoneNumber?.startsWith('+254')
    const isStripeValid = paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv && paymentData.cardName
    const isPaypalValid = paymentData.email && paymentData.email.includes('@')

    const isFormValid = 
        paymentMethod === 'mpesa' ? isMpesaValid :
        paymentMethod === 'stripe' ? isStripeValid :
        paymentMethod === 'paypal' ? isPaypalValid : true

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Complete Your Subscription</DialogTitle>
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold">{plan.name} Plan</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ${currentPrice.toFixed(2)} USD /{selectedPeriod}
                        </p>
                        {selectedPeriod === 'yearly' && savePercent > 0 && (
                            <p className="text-sm text-green-600">Save {savePercent}% compared to monthly</p>
                        )}
                        {convertedAmount && (
                            <p className="text-sm text-gray-600">
                                ≈ {getCurrencySymbol(userCurrency)} {convertedAmount} (converted at current rate)
                            </p>
                        )}
                    </div>
                </DialogHeader>

                <Tabs defaultValue={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'monthly' | 'yearly')} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="mpesa" className="flex items-center space-x-1">
                            <Smartphone className="h-4 w-4" />
                            <span>M-Pesa</span>
                        </TabsTrigger>
                        <TabsTrigger value="stripe" className="flex items-center space-x-1">
                            <CreditCard className="h-4 w-4" />
                            <span>Card</span>
                        </TabsTrigger>
                        <TabsTrigger value="paypal" className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>PayPal</span>
                        </TabsTrigger>
                    </TabsList>
                    

                    {/* M-Pesa Payment */}
                    <TabsContent value="mpesa" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    placeholder="+254 700 000 000"
                                    value={paymentData.phoneNumber}
                                    onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                                />
                                {paymentMethod === 'mpesa' && !isMpesaValid && (
                                    <div className="flex items-center text-red-500 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Phone must start with +254
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You will receive an M-Pesa prompt on your phone to complete the payment.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Stripe Payment */}
                    <TabsContent value="stripe" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardName">Cardholder Name</Label>
                                <Input
                                    id="cardName"
                                    placeholder="John Doe"
                                    value={paymentData.cardName}
                                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <Input
                                    id="cardNumber"
                                    placeholder="1234 5678 9012 3456"
                                    value={paymentData.cardNumber}
                                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input
                                        id="expiryDate"
                                        placeholder="MM/YY"
                                        value={paymentData.expiryDate}
                                        onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvv">CVV</Label>
                                    <Input
                                        id="cvv"
                                        placeholder="123"
                                        value={paymentData.cvv}
                                        onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                                    />
                                </div>
                            </div>
                            {!isStripeValid && (
                                <div className="flex items-center text-red-500 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    All card details are required
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* PayPal Payment */}
                    <TabsContent value="paypal" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="paypalEmail">PayPal Email</Label>
                                <Input
                                    id="paypalEmail"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={paymentData.email}
                                    onChange={(e) => setPaymentData({ ...paymentData, email: e.target.value })}
                                />
                            </div>
                            {!isPaypalValid && (
                                <div className="flex items-center text-red-500 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Valid email is required
                                </div>
                            )}
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    You will be redirected to PayPal to complete your payment securely.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Payment Button */}
                <div className="space-y-4">
                    <Button 
                        onClick={handlePayment} 
                        disabled={loading || !isFormValid || ratesLoading} 
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Pay ${currentPrice.toFixed(2)} USD Now
                            </>
                        )}
                    </Button>

                    <div className="text-center text-xs text-gray-500">
                        <p>🔒 Your payment information is secure and encrypted</p>
                        <p>30-day money-back guarantee</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}