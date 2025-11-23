"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import getSymbol from "currency-symbol-map"

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
  const [currency, setCurrencyState] = useState<Currency>("KES")
  const [currencyRates, setCurrencyRates] = useState<Record<Currency, number>>({})
  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem("pig_farm_currency") as Currency
    if (savedCurrency) {
      setCurrencyState(savedCurrency)
    }

    // Fetch exchange rates from ExchangeRate-API
    const fetchExchangeRates = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_API_KEY}/latest/${process.env.NEXT_PUBLIC_BASE_CURRENCY}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        if (data.result === "success") {
          setCurrencyRates(data.conversion_rates)
          const currencies = Object.keys(data.conversion_rates)
          setSupportedCurrencies(currencies)
          // Cache rates and currencies
          localStorage.setItem("currency_rates", JSON.stringify(data.conversion_rates))
          localStorage.setItem("supported_currencies", JSON.stringify(currencies))
          localStorage.setItem("rates_last_updated", Date.now().toString())
          // Validate saved currency
          if (savedCurrency && !currencies.includes(savedCurrency)) {
            const defaultCurrency = process.env.NEXT_PUBLIC_BASE_CURRENCY || "USD"
            setCurrencyState(defaultCurrency)
            localStorage.setItem("pig_farm_currency", defaultCurrency)
          }
        } else {
          throw new Error(data.error || "API request failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching exchange rates:", err)
        // Load cached rates if available
        const cachedRates = localStorage.getItem("currency_rates")
        const cachedCurrencies = localStorage.getItem("supported_currencies")
        if (cachedRates && cachedCurrencies) {
          setCurrencyRates(JSON.parse(cachedRates))
          setSupportedCurrencies(JSON.parse(cachedCurrencies))
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Check if rates are cached and not older than 24 hours
    const lastUpdated = localStorage.getItem("rates_last_updated")
    const ratesCache = localStorage.getItem("currency_rates")
    const currenciesCache = localStorage.getItem("supported_currencies")
    const oneDay = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (
      ratesCache &&
      currenciesCache &&
      lastUpdated &&
      Date.now() - parseInt(lastUpdated) < oneDay
    ) {
      setCurrencyRates(JSON.parse(ratesCache))
      setSupportedCurrencies(JSON.parse(currenciesCache))
      setIsLoading(false)
    } else {
      fetchExchangeRates()
    }
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    if (supportedCurrencies.includes(newCurrency)) {
      setCurrencyState(newCurrency)
      localStorage.setItem("pig_farm_currency", newCurrency)
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
