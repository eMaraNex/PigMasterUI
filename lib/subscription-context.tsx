"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { roles } from "./constants";
import { useAuth } from "./auth-context";
import { apiUrl, getFarmTrialInfo, type TrialInfo } from "./utils";

type SubscriptionTier = "free" | "standard" | "advanced" | "admin" | "superadmin"

interface SubscriptionLimits {
    maxRows: number
    maxPigs: number
    maxUsers: number
    maxReports: number
}

interface SubscriptionContextType {
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
    if (["free", "trial"].includes(normalized)) return "free";
    return "free";
};

const isActivePaidSubscription = (subscription: any): boolean => {
    if (!subscription) return false;

    const planName = String(subscription.current_plan || subscription.plan_name || subscription.plan || subscription.tier || "").trim();
    const status = String(subscription.status || subscription.payment_status || "").trim().toLowerCase();
    const expiryDate = subscription.expiry_date || subscription.subscription_end || null;
    const isNotExpired = !expiryDate || new Date(expiryDate).getTime() > Date.now();
    const isPaidPlan = planName !== "" && normalizeTier(planName) !== "free";
    const isActiveStatus = status === "active" || status === "paid" || status === "trial" === false;

    return Boolean(isPaidPlan && isActiveStatus && isNotExpired);
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [tier, setTier] = useState<SubscriptionTier>("free");
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
    const [trialInfo, setTrialInfo] = useState<TrialInfo>({
        isTrialActive: false,
        trialEndsAt: null,
        trialDaysLeft: 0,
    });

    const refreshSubscription = async () => {
        const token = localStorage.getItem("pig_farm_token");

        if (!user || !token) {
            const fallbackRole = user?.role_id ? parseInt(user.role_id, 10) : undefined;
            if (fallbackRole && !isNaN(fallbackRole) && roles[fallbackRole]) {
                setTier(normalizeTier(roles[fallbackRole].name));
            } else {
                setTier("free");
            }
            setSubscriptionEndsAt(null);
            return;
        }

        try {
            const response = await axios.get(`${apiUrl}/subscriptions/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const subscription = response.data?.data;
            const planFromApi = subscription?.current_plan || subscription?.plan_name || subscription?.plan || subscription?.tier;
            const expiryDate = subscription?.expiry_date || subscription?.subscription_end || user?.subscription_end || null;

            const paidPlanActive = isActivePaidSubscription(subscription);

            if (paidPlanActive && planFromApi) {
                setTier(normalizeTier(planFromApi));
                setSubscriptionEndsAt(expiryDate || null);
                return;
            }

            if (expiryDate && new Date(expiryDate).getTime() > Date.now()) {
                const fallbackTier = normalizeTier(planFromApi || user?.subscription_plan || user?.role_id ? roles[Number(user.role_id)]?.name : undefined);
                setTier(fallbackTier === "free" ? "free" : fallbackTier);
                setSubscriptionEndsAt(expiryDate);
                return;
            }

            setTier("free");
            setSubscriptionEndsAt(expiryDate || null);
        } catch (error) {
            console.warn("Failed to fetch subscription state:", error);
            const fallbackRole = user?.role_id ? parseInt(user.role_id, 10) : undefined;
            if (fallbackRole && !isNaN(fallbackRole) && roles[fallbackRole]) {
                setTier(normalizeTier(roles[fallbackRole].name));
            } else {
                setTier("free");
            }
            setSubscriptionEndsAt(null);
        }
    };

    useEffect(() => {
        const updateTrialInfo = () => {
            const info = getFarmTrialInfo();
            setTrialInfo(info);
        };

        updateTrialInfo();
        refreshSubscription();

        const interval = window.setInterval(() => {
            updateTrialInfo();
            refreshSubscription();
        }, 60 * 1000);

        return () => window.clearInterval(interval);
    }, [user]);

    const isPaidSubscriptionActive = tier !== "free" && subscriptionEndsAt ? new Date(subscriptionEndsAt).getTime() > Date.now() : false;
    const effectiveTrialActive = !isPaidSubscriptionActive && trialInfo.isTrialActive;
    const effectiveTier = isPaidSubscriptionActive ? tier : "free";

    const isFeatureAvailable = (feature: string): boolean => {
        if (effectiveTrialActive) {
            return true;
        }
        return featureMatrix[effectiveTier].includes(feature)
    }

    const canAddMore = (type: string, current: number): boolean => {
        if (effectiveTrialActive) {
            return true;
        }
        const key = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SubscriptionLimits;
        const limit = limits[key];
        return limit === -1 || current < limit
    }

    const upgradeTo = (newTier: SubscriptionTier) => {
        setTier(newTier)
        setSubscriptionEndsAt(null)
        console.log(`Upgraded to ${newTier} tier`)
    }

    const getNextTier = (): SubscriptionTier | null => {
        if (tier === "free") return "standard";
        if (tier === "standard") return "advanced";
        return null;
    }

    const limits = effectiveTrialActive ? subscriptionLimits.advanced : subscriptionLimits[effectiveTier]

    return (
        <SubscriptionContext.Provider
            value={{
                tier: effectiveTier,
                limits,
                isFeatureAvailable,
                canAddMore,
                upgradeTo,
                getNextTier,
                isTrialActive: effectiveTrialActive,
                trialEndsAt: trialInfo.trialEndsAt,
                trialDaysLeft: trialInfo.trialDaysLeft,
                subscriptionEndsAt,
                refreshSubscription,
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