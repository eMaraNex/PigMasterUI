"use client";

import type React from "react";

import { useAuth } from "@/lib/auth-context";
import LoginPage from "../../app/(auth)/login/page";
import { ProtectedRouteProps } from "@/types";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white/30 rounded"></div>
          </div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
