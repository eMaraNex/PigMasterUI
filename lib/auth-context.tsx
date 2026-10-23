"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { apiRequest } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import type { AuthContextType, AuthResponse, User } from "@/types";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "@/lib/firebase";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setSession, clearSession } from "@/lib/redux/session/sessionSlice";
import { api, useGetCurrentUserQuery } from "@/lib/redux/api";
import { clearProduction } from "@/lib/redux/production/productionSlice";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (value: Record<string, unknown>): User => ({
  id: typeof value.id === "string" ? value.id : undefined,
  email: typeof value.email === "string" ? value.email : "",
  name: typeof value.name === "string" ? value.name : "Farm Administrator",
  farm_id: typeof value.farm_id === "string" ? value.farm_id : "",
  role_id: typeof value.role_id === "string" || typeof value.role_id === "number"
    ? String(value.role_id) : "",
  email_verified: value.email_verified === true,
  avatar_url: typeof value.avatar_url === "string" ? value.avatar_url : "",
  created_at: typeof value.created_at === "string" ? value.created_at : "",
  subscription_start: typeof value.subscription_start === "string" ? value.subscription_start : "",
  subscription_end: typeof value.subscription_end === "string" ? value.subscription_end : "",
  subscription_plan: typeof value.subscription_plan === "string" ? value.subscription_plan : "",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const dispatch = useAppDispatch();
  const { data: currentSession, isLoading, isError } = useGetCurrentUserQuery();
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("pig_farm_token");
    localStorage.removeItem("pig_farm_user");
    localStorage.removeItem("pig_farm_id");
  }, []);

  useEffect(() => {
    if (currentSession) {
      const sessionUser = toUser(currentSession);
      setUser(sessionUser);
      dispatch(setSession(sessionUser));
    } else if (!isLoading && isError) {
      setUser(null);
      dispatch(clearSession());
    }
  }, [currentSession, dispatch, isError, isLoading]);

  useEffect(() => {
    const interceptor = apiRequest.interceptors.response.use(
      response => {
        const method = String(response.config.method ?? "get").toLowerCase();
        if (["post", "put", "patch", "delete"].includes(method)) {
          const path = String(response.config.url ?? "").split("?")[0].toLowerCase();
          const tags: Array<"Farm" | "Pig" | "Rows" | "Pens" | "Earnings" | "Subscription" | "CurrentUser"> = [];
          if (path.includes("/farms")) tags.push("Farm", "CurrentUser");
          if (path.includes("/pigs") || path.includes("/health") || path.includes("/breeds")) {
            tags.push("Pig");
          }
          if (path.includes("/rows")) tags.push("Rows");
          if (path.includes("/pens")) tags.push("Pens");
          if (path.includes("/earnings")) tags.push("Earnings");
          if (path.includes("/subscriptions") || path.includes("/payments")) {
            tags.push("Subscription");
          }
          if (tags.length) dispatch(api.util.invalidateTags(tags));
        }
        return response;
      },
      error => {
        const requestUrl = String(error.config?.url || "");
        if (error.response?.status === 401 && !requestUrl.includes("/auth/")) {
          setUser(null);
          dispatch(clearSession());
          dispatch(clearProduction());
          dispatch(api.util.resetApiState());
          router.push("/");
        }
        return Promise.reject(error);
      }
    );
    return () => apiRequest.interceptors.response.eject(interceptor);
  }, [dispatch, router]);

  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || "An unexpected error occurred";
    }
    return error instanceof Error ? error.message : "An unexpected error occurred";
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiRequest.post("/auth/login", { email, password });
      if (response.status !== 200) return { success: false, message: "Invalid email or password" };
      const data = response.data?.data;
      const userData = toUser(data?.user ?? {});
      setUser(userData);
      dispatch(setSession(userData));
      dispatch(api.util.invalidateTags(["CurrentUser"]));
      router.push("/");
      return { success: true, message: response.data.message || "Login successful", data: { user: userData } };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    privacyPolicyAccepted = false,
    marketingConsent = false
  ): Promise<AuthResponse> => {
    try {
      const response = await apiRequest.post("/auth/register", {
        email,
        password,
        name,
        phone,
        privacy_policy_accepted: privacyPolicyAccepted,
        marketing_consent: marketingConsent,
      });
      if (response.status === 201) {
        router.push("/login");
        return { success: true, message: "Registration successful. Please log in." };
      }
      return { success: false, message: "Failed to register" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const logout = async (): Promise<AuthResponse> => {
    let serverError: string | null = null;
    try {
      await apiRequest.post("/auth/logout");
    } catch (error) {
      serverError = getErrorMessage(error);
    }
    try {
      for (const key of Object.keys(localStorage)) {
        if (key !== "pigmaster.preferences.v1" && key !== "currency_rates"
          && key !== "supported_currencies" && key !== "rates_last_updated") {
          localStorage.removeItem(key);
        }
      }
      if ("indexedDB" in window && "databases" in indexedDB) {
        const databases = await indexedDB.databases();
        for (const database of databases) {
          if (database.name) indexedDB.deleteDatabase(database.name);
        }
      }
      setUser(null);
      dispatch(clearSession());
      dispatch(api.util.resetApiState());
      router.push("/");
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
    return serverError
      ? { success: false, message: `Signed out locally; server logout failed: ${serverError}` }
      : { success: true, message: "Logout successful" };
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const response = await apiRequest.post("/auth/forgot-password", { email });
      return { success: true, message: response.data.message || "Password reset email sent" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const resetPassword = async (params: { token: string; currentPassword: string; newPassword: string }): Promise<AuthResponse> => {
    try {
      const response = await apiRequest.post("/auth/reset-password", {
        token: params.token,
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
      });
      return { success: true, message: response.data.message || "Password reset successfully" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const googleAuth = async (): Promise<AuthResponse> => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      return { success: false, message: "Google sign-in is not configured. Set the Firebase environment variables first." };
    }
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken(true);
      const response = await apiRequest.post("/auth/sso", { idToken });
      const userData = toUser(response.data?.data?.user ?? {});
      if (!userData.email) return { success: false, message: "Authentication response did not include a user." };
      setUser(userData);
      dispatch(setSession(userData));
      dispatch(api.util.invalidateTags(["CurrentUser"]));
      router.push("/");
      return { success: true, message: "Authentication successful", data: { user: userData } };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword, resetPassword, googleAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
