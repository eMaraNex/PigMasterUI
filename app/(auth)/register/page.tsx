"use client";

import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Mail, Lock, User, Phone, Eye, EyeOff, PiggyBank } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import ThemeToggle from "../../../components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/toast-provider";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  phone?: string;
}

export default function RegisterPage() {
  const { register, forgotPassword, googleAuth } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { showError, showSuccess } = useToast();
  const currentYear = new Date().getFullYear();

  // Real-time validation function
  const validateField = (field: keyof FormData, value: string): string | null => {
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return "Email is required";
        if (!emailRegex.test(value)) return "Invalid email format";
        return null;

      case 'name':
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return null;

      case 'phone':
        if (!value.trim()) return "Phone is required";
        if (value.trim().length < 10) return "Phone must be at least 10 characters";
        return null;

      case 'password':
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;

      case 'confirmPassword':
        if (!value) return "Please confirm your password";
        if (formData.password !== value) return "Passwords do not match";
        return null;

      default:
        return null;
    }
  };

  // Validation function for form submission
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const field = key as keyof FormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormData, value: string): void => {
    setFormData({ ...formData, [field]: value });
    const error = validateField(field, value);
    setErrors((prev: FormErrors) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      if (field === 'password' && formData.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        if (confirmError) {
          newErrors.confirmPassword = confirmError;
        } else {
          delete newErrors.confirmPassword;
        }
      }

      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Error', "Please fix the errors in the form")
      return;
    }

    setIsLoading(true);
    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone
      );
      showSuccess('Success', response.message);
      if (response.success) {
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (error) {
      showError('Error', error?.toString())
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await googleAuth();
      if (response.success) {
        showSuccess('Success', response.message);
      } else {
        showError('Error', response.message);
      }
    } catch (error) {
      showError('Error', error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await forgotPassword(forgotPasswordEmail);
      showSuccess('Success', response.message);
      if (response.success) {
        setForgotPasswordEmail("");
        setIsForgotPasswordOpen(false);
      }
    } catch (error) {
      showError('Error', error?.toString())
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>): void => {
      handleFieldChange(field, e.target.value);
    };
  };
  const isFormValid = (): boolean => {
    const hasErrors = Object.keys(errors).length > 0;
    const hasEmptyFields = !formData.email || !formData.password || !formData.confirmPassword || !formData.name || !formData.phone;
    return !hasErrors && !hasEmptyFields;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4">
            <PiggyBank className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Pig Farm
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Professional Pig Management System
          </p>
        </div>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center dark:text-white">
              Create Account
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Sign up to manage your farm
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleRegister}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.20-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Registering..." : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full dark:bg-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200">
                  Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className={`pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.name ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@org.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.email ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="dark:text-gray-200">
                  Phone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    className={`pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.phone ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`pl-10 pr-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.password ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.confirmPassword ? "border-red-500 dark:border-red-500" : ""
                      } ${formData.confirmPassword && formData.password === formData.confirmPassword
                        ? "border-green-500 dark:border-green-500"
                        : ""
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                  <p className="text-green-500 text-sm mt-1">Passwords match!</p>
                )}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
                <Link
                  href="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Login
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog
          open={isForgotPasswordOpen}
          onOpenChange={setIsForgotPasswordOpen}
        >
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                Reset Password
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="dark:text-gray-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="dark:border-gray-600 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© {currentYear} Pig Farming. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
