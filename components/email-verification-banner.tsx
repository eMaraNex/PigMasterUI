"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import EmailVerificationModal from "@/components/email-verification-modal";
import { useAuth } from "@/lib/auth-context";

const EmailVerificationBanner: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    useEffect(() => {
        if (dismissedAt) {
            const timer = setTimeout(() => {
                setIsDismissed(false);
                setDismissedAt(null);
            }, 60 * 60 * 4000);

            return () => clearTimeout(timer);
        }
    }, [dismissedAt]);

    const handleDismiss = () => {
        setIsDismissed(true);
        setDismissedAt(Date.now());
    };

    const handleVerificationSent = () => {
        setVerificationSent(true);
    };
    if (!user || user.email_verified || isDismissed || verificationSent) return null;

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-md mb-6 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Email verification required
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Verify your email to receive notifications and access all features.
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDismiss}
                        className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                        Dismiss
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                        Verify Email
                    </Button>
                </div>
            </div>
            <EmailVerificationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                userEmail={user?.email || ""}
                onVerificationSent={handleVerificationSent}
            />
        </>
    );
};

export default EmailVerificationBanner;