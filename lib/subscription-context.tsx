"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { useGetSubscriptionQuery } from "./redux/api";

type SubscriptionTier = "free" | "standard" | "advanced" | "admin" | "superadmin"

interface SubscriptionLimits {
    maxRows: number
    maxPigs: number
    maxUsers: number
    maxReports: number
}

interface SubscriptionContextType {
    /** False until the API has answered; nothing is locked or nagged before that. */
    ready: boolean
    /** Team members use the owner's plan and cannot manage billing. */
    isFarmOwner: boolean
    tier: SubscriptionTier
    limits: SubscriptionLimits
    isFeatureAvailable: (feature: string) => boolean
    canAddMore: (type: string, current: number) => boolean
    upgradeTo: (newTier: SubscriptionTier) => void
    getNextTier: () => SubscriptionTier | null
    isTrialActive: boolean
    trialEndsAt: string | null
    trialDaysLeft: number
    subscriptionEndsAt: string | null
    refreshSubscription: () => Promise<void>
}

const subscriptionLimits: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        maxRows: 3,
        maxPigs: 54,
        maxUsers: 1,
        maxReports: 5,
    },
    standard: {
        maxRows: 10,
        maxPigs: 180,
        maxUsers: 3,
        maxReports: 50,
    },
    advanced: {
        maxRows: -1,
        maxPigs: -1,
        maxUsers: -1,
        maxReports: -1,
    },
    admin: {
        maxRows: -1,
        maxPigs: -1,
        maxUsers: -1,
        maxReports: -1,
    },
    superadmin: {
        maxRows: -1,
        maxPigs: -1,
        maxUsers: -1,
        maxReports: -1,
    },
}

const featureMatrix: Record<SubscriptionTier, string[]> = {
    free: [
        "basic_analytics", "basic_reports", "record_keeping",
        "overview", "pens", "breeding"
    ],
    standard: [
        "basic_analytics", "enhanced_analytics", "basic_reports", "export_reports",
        "email_notifications", "user_management", "weekly_reports",
        "overview", "pens", "breeding", "health", "feeding", "earnings"
    ],
    advanced: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "pens", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
    admin: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "pens", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
    superadmin: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "pens", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
}

const normalizeTier = (value: unknown): SubscriptionTier => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (["admin", "administrator"].includes(normalized)) return "admin";
    if (["superadmin", "super-admin", "super_admin"].includes(normalized)) return "superadmin";
    if (["advanced", "premium", "pro"].includes(normalized)) return "advanced";
    if (["standard", "starter"].includes(normalized)) return "standard";
    return "free";
};

const DAY_MS = 24 * 60 * 60 * 1000;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

/**
 * Plan and trial state come from the API (/subscriptions/me), which already resolves
 * team members to the farm owner's plan. Nothing is decided until that answer arrives
 * (`ready`), so paid farms never see a "trial ended" flash or an upgrade prompt.
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { data, isLoading, isError, refetch } = useGetSubscriptionQuery(undefined, {
        skip: !user,
        pollingInterval: 5 * 60 * 1000,
        refetchOnFocus: true,
    });
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 60 * 1000);
        return () => window.clearInterval(interval);
    }, []);

    const ready = Boolean(user) && !isLoading && (data !== undefined || isError);
    const expiry = data?.expiry_date ?? null;
    const paidActive = Boolean(data?.has_active_subscription) && data?.status !== "trial";
    const tier: SubscriptionTier = paidActive ? normalizeTier(data?.current_plan ?? data?.plan_name) : "free";
    const effectiveTier: SubscriptionTier = paidActive && tier === "free" ? "standard" : tier;
    const trialEndsAt = data?.trial_ends_at ?? data?.trial_end_date ?? null;
    const isTrialActive = !paidActive && Boolean(data?.is_trial_active);
    const trialDaysLeft = isTrialActive && trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / DAY_MS)) : 0;
    const fullAccess = isTrialActive || !ready;

    const limits = fullAccess ? subscriptionLimits.advanced : subscriptionLimits[effectiveTier];

    // Until the plan is known nothing is locked; screens show their own loading states.
    const isFeatureAvailable = (feature: string): boolean => fullAccess || featureMatrix[effectiveTier].includes(feature);

    const canAddMore = (type: string, current: number): boolean => {
        if (fullAccess) return true;
        const key = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SubscriptionLimits;
        const limit = limits[key];
        return limit === -1 || current < limit
    }

    const getNextTier = (): SubscriptionTier | null => {
        if (effectiveTier === "free") return "standard";
        if (effectiveTier === "standard") return "advanced";
        return null;
    }

    return (
        <SubscriptionContext.Provider
            value={{
                ready,
                tier: effectiveTier,
                limits,
                isFeatureAvailable,
                canAddMore,
                upgradeTo: () => { void refetch(); },
                getNextTier,
                isTrialActive,
                trialEndsAt,
                trialDaysLeft,
                subscriptionEndsAt: paidActive ? expiry : null,
                isFarmOwner: data?.is_farm_owner !== false,
                refreshSubscription: async () => { await refetch(); },
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const context = useContext(SubscriptionContext)
    if (context === undefined) {
        throw new Error("useSubscription must be used within a SubscriptionProvider")
    }
    return context
}