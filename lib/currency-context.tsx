"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import getSymbol from "currency-symbol-map"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setCurrency as setCurrencyPreference } from "@/lib/redux/preferences/preferencesSlice"
import { apiRequest } from "@/lib/api/client"

type Currency = string;

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatAmount: (amount: number) => string
  convertToBaseCurrency: (amount: number, fromCurrency: Currency) => number
  convertFromBaseCurrency: (amount: number, toCurrency: Currency) => number
  getCurrencySymbol: (currency: Currency) => string
  getCurrencyRates: () => Record<Currency, number>
  supportedCurrencies: Currency[]
  isLoading: boolean
  error: string | null
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useAppSelector(state => state.preferences.currency)
  const dispatch = useAppDispatch()
  const initialCurrency = useRef(currency).current
  const [currencyRates, setCurrencyRates] = useState<Record<Currency, number>>({})
  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Rates come from the PigMaster API, which holds any provider key server-side
    // and falls back to a free no-key source, so nothing needs configuring here.
    const fetchExchangeRates = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const baseCurrency = (process.env.NEXT_PUBLIC_BASE_CURRENCY?.trim() || "USD").toUpperCase()
        const response = await apiRequest.get("/currency/rates", { params: { base: baseCurrency } })
        const rates = response.data?.data?.rates
        if (!rates || typeof rates !== "object") throw new Error("Exchange rates are unavailable right now.")
        setCurrencyRates(rates)
        const currencies = Object.keys(rates).sort()
        setSupportedCurrencies(currencies)
        try {
          localStorage.setItem("currency_rates", JSON.stringify(rates))
          localStorage.setItem("supported_currencies", JSON.stringify(currencies))
          localStorage.setItem("rates_last_updated", Date.now().toString())
        } catch {
          // Storage can be unavailable (private mode); rates still work for this visit.
        }
        if (initialCurrency && !currencies.includes(initialCurrency)) {
          dispatch(setCurrencyPreference(baseCurrency))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching exchange rates:", err)
        try {
          const cachedRates = localStorage.getItem("currency_rates")
          const cachedCurrencies = localStorage.getItem("supported_currencies")
          if (cachedRates && cachedCurrencies) {
            setCurrencyRates(JSON.parse(cachedRates))
            setSupportedCurrencies(JSON.parse(cachedCurrencies))
          }
        } catch {
          // Ignore unreadable cache.
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Check if rates are cached and not older than 24 hours
    let lastUpdated: string | null = null
    let ratesCache: string | null = null
    let currenciesCache: string | null = null
    try {
      lastUpdated = localStorage.getItem("rates_last_updated")
      ratesCache = localStorage.getItem("currency_rates")
      currenciesCache = localStorage.getItem("supported_currencies")
    } catch {
      // Storage blocked: always fetch.
    }
    const twelveHours = 12 * 60 * 60 * 1000

    if (ratesCache && currenciesCache && lastUpdated && Date.now() - parseInt(lastUpdated) < twelveHours) {
      setCurrencyRates(JSON.parse(ratesCache))
      setSupportedCurrencies(JSON.parse(currenciesCache))
      setIsLoading(false)
    } else {
      fetchExchangeRates()
    }
  }, [dispatch, initialCurrency])

  const setCurrency = (newCurrency: Currency) => {
    if (supportedCurrencies.includes(newCurrency)) {
      dispatch(setCurrencyPreference(newCurrency))
    } else {
      console.warn(`Currency ${newCurrency} is not supported`)
    }
  }

  const formatAmount = (amount: number) => {
    const symbol = getSymbol(currency) || currency
    const convertedAmount = convertFromBaseCurrency(amount, currency)

    // Adjust formatting for currencies with no decimals
    const noDecimalCurrencies = [
      "BIF", "CLP", "DJF", "GNF", "JPY", "KES", "KRW",
      "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF",
      "XOF", "XPF"
    ]
    if (noDecimalCurrencies.includes(currency)) {
      return `${symbol} ${convertedAmount.toLocaleString("en-KE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    }

    return `${symbol}${convertedAmount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const convertToBaseCurrency = (amount: number, fromCurrency: Currency) => {
    const result = amount / (currencyRates[fromCurrency] || 1);
    return result;
  }

  const convertFromBaseCurrency = (amount: number, toCurrency: Currency) => {
    const result = amount * (currencyRates[toCurrency] || 1);
    return result;
  }

  const getCurrencySymbol = (currencyCode: Currency) => getSymbol(currencyCode) || currencyCode

  const getCurrencyRates = () => currencyRates

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
        convertToBaseCurrency,
        convertFromBaseCurrency,
        getCurrencySymbol,
        getCurrencyRates,
        supportedCurrencies,
        isLoading,
        error,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
