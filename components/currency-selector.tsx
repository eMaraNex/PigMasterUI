"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/lib/currency-context"
import getSymbol from "currency-symbol-map"

export default function CurrencySelector() {
  const {
    currency,
    setCurrency,
    formatAmount,
    supportedCurrencies,
    isLoading,
    error,
  } = useCurrency()

  const getCurrencyLabel = (code: string) => {
    const symbol = getSymbol(code) || code
    return `${code} (${symbol})`
  }

  if (isLoading) return <div className="text-muted-foreground">Loading currencies...</div>
  if (error) return <div className="text-destructive">Error: {error}</div>

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex items-center w-full">
        <Select value={currency} onValueChange={(value) => setCurrency(value)}>
          <SelectTrigger className="w-full bg-muted border-border">
            <SelectValue placeholder="Select a currency" />
          </SelectTrigger>
          <SelectContent>
            {supportedCurrencies.sort().map((curr) => (
              <SelectItem key={curr} value={curr}>
                {getCurrencyLabel(curr)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}