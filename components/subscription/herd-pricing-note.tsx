export type QuotePricing = {
    currency: string; basePrice: number; includedPigs: number; pricePerExtraPig: number
    maxPrice: number | null; pigCount: number; extraPigs: number; monthlyPrice: number
}

/** How the herd size shapes the price: "Your farm: 320 pigs · first 50 included · 270 extra". */
export function HerdPricingNote({ pricing }: { pricing?: QuotePricing }) {
    if (!pricing || (!pricing.includedPigs && !pricing.pricePerExtraPig)) return null
    const pigs = `${pricing.pigCount.toLocaleString()} pig${pricing.pigCount === 1 ? "" : "s"}`
    return (
        <p className="text-xs text-gray-500 dark:text-gray-400">
            Your farm: {pigs} · first {pricing.includedPigs.toLocaleString()} included
            {pricing.extraPigs > 0 && ` · ${pricing.extraPigs.toLocaleString()} extra`}
        </p>
    )
}
