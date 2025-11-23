"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useToast } from "@/lib/toast-provider";

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    onVerificationSent?: () => void;
}

interface FormErrors {
    email?: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
    isOpen,
    onClose,
    userEmail,
    onVerificationSent
}) => {
    const [email, setEmail] = useState(userEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const { showSuccess, showError, showWarn } = useToast();

    const validateEmail = (value: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return "Email is required";
        if (!emailRegex.test(value)) return "Invalid email format";
        return null;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        const error = validateEmail(value);
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors.email = error;
            } else {
                delete newErrors.email;
            }
            return newErrors;
        });
    };

    const handleResendVerification = async () => {
        const emailError = validateEmail(email);
        if (emailError) {
            setErrors({ email: emailError });
            showError('Error', "Please enter a valid email address")
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `${utils.apiUrl}/auth/resend-verification`,
                { email },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                showSuccess('Success', response.data.message);
                onClose();
                onVerificationSent?.();
            } else {
                showError('Error', response.data.message)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to send verification email";
            showError('Error', errorMessage)
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = (): boolean => {
        const hasError = errors.email;
        const isEmpty = !email;
        return !hasError && !isEmpty;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-white flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        Email Verification
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                                    Verify your email address
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    To receive notifications and access all features, you need to verify your email address.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="verification-email" className="dark:text-gray-200">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                                id="verification-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={handleEmailChange}
                                className={`pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.email ? "border-red-500 dark:border-red-500" : ""
                                    }`}
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                                We'll send a verification link to your email address.
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="dark:border-gray-600 dark:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isLoading || !isFormValid()}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Sending..." : "Send Verification Email"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmailVerificationModal;