"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react";
import { roles } from "./constants";
import { useAuth } from "./auth-context"; 
import { getFarmTrialInfo, type TrialInfo } from "./utils";

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
}

const subscriptionLimits: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        maxRows: 3,
        maxPigs: 54, // 3 rows * 18 hutches
        maxUsers: 1,
        maxReports: 5,
    },
    standard: {
        maxRows: 10,
        maxPigs: 180, // 10 rows * 18 hutches
        maxUsers: 3,
        maxReports: 50,
    },
    advanced: {
        maxRows: -1, // unlimited
        maxPigs: -1, // unlimited
        maxUsers: -1, // unlimited
        maxReports: -1, // unlimited
    },
    admin: {
        maxRows: -1, // unlimited
        maxPigs: -1, // unlimited
        maxUsers: -1, // unlimited
        maxReports: -1, // unlimited
    },
    superadmin: {
        maxRows: -1, // unlimited
        maxPigs: -1, // unlimited
        maxUsers: -1, // unlimited
        maxReports: -1, // unlimited
    },
}

const featureMatrix: Record<SubscriptionTier, string[]> = {
    free: [
        "basic_analytics", "basic_reports", "record_keeping",
        "overview", "hutches", "breeding"
    ],
    standard: [
        "basic_analytics", "enhanced_analytics", "basic_reports", "export_reports",
        "email_notifications", "user_management", "weekly_reports",
        "overview", "hutches", "breeding", "health", "feeding", "earnings"
    ],
    advanced: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "hutches", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
    admin: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "hutches", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
    superadmin: [
        "basic_analytics", "enhanced_analytics", "advanced_analytics",
        "basic_reports", "export_reports", "email_notifications", "sms_notifications",
        "user_management", "calendar_integration", "weekly_reports", "monthly_reports",
        "automated_backups", "priority_support",
        "overview", "hutches", "breeding", "health", "feeding", "earnings", "reports", "analytics", "calender"
    ],
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth(); 
    const [tier, setTier] = useState<SubscriptionTier>("free");
    const [trialInfo, setTrialInfo] = useState<TrialInfo>({
        isTrialActive: false,
        trialEndsAt: null,
        trialDaysLeft: 0,
    });

    useEffect(() => {
        const roleId = user?.role_id ? parseInt(user.role_id, 10) : undefined;
        if (roleId && !isNaN(roleId) && roles[roleId]) {
            const newTier = roles[roleId].name as SubscriptionTier;
            setTier(newTier);
        } else {
            setTier("free");
        }
    }, [user]);

    useEffect(() => {
        const updateTrialInfo = () => {
            const info = getFarmTrialInfo();
            setTrialInfo(info);
        };

        updateTrialInfo();
        const interval = window.setInterval(updateTrialInfo, 60 * 60 * 1000); // refresh hourly
        return () => window.clearInterval(interval);
    }, [user]);

    const isFeatureAvailable = (feature: string): boolean => {
        if (trialInfo.isTrialActive) {
            return true;
        }
        return featureMatrix[tier].includes(feature)
    }

    const canAddMore = (type: string, current: number): boolean => {
        if (trialInfo.isTrialActive) {
            return true;
        }
        const key = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SubscriptionLimits;
        const limit = limits[key];
        return limit === -1 || current < limit
    }

    const upgradeTo = (newTier: SubscriptionTier) => {
        setTier(newTier)
        // In real app, this would make API call to update subscription
        console.log(`Upgraded to ${newTier} tier`)
    }

    const getNextTier = (): SubscriptionTier | null => {
        if (tier === "free") return "standard";
        if (tier === "standard") return "advanced";
        return null;
    }

    const limits = trialInfo.isTrialActive ? subscriptionLimits.advanced : subscriptionLimits[tier]

    return (
        <SubscriptionContext.Provider
            value={{
                tier,
                limits,
                isFeatureAvailable,
                canAddMore,
                upgradeTo,
                getNextTier,
                isTrialActive: trialInfo.isTrialActive,
                trialEndsAt: trialInfo.trialEndsAt,
                trialDaysLeft: trialInfo.trialDaysLeft
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