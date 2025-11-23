"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as utils from "./utils";
import { AuthContextType, AuthResponse, User } from "@/types";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); 
  const router = useRouter();

  // Function to decode JWT and check expiration
  const isTokenExpired = (token: string): boolean => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  // Function to set or clear Axios Authorization header
  const setAuthHeader = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Standardize error message extraction
  const getErrorMessage = (error: any): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || "An unexpected error occurred";
    }
    return error.message || "An unexpected error occurred";
  };

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("pig_farm_token");
      const savedUser = localStorage.getItem("pig_farm_user");

      if (savedToken && savedUser) {
        try {
          // Check if token is expired
          if (!isTokenExpired(savedToken)) {
            setUser(JSON.parse(savedUser));
            setAuthHeader(savedToken); // Set token in Axios headers
          } else {
            // Clear expired token and user data
            Cookies.remove("pig_farm_token", { path: "/", secure: true, sameSite: "strict" });
            localStorage.removeItem("pig_farm_user");
            localStorage.removeItem("pig_farm_id");
            setAuthHeader(null);
          }
        } catch (error) {
          console.error("Error parsing saved user or token:", error);
          Cookies.remove("pig_farm_token", { path: "/", secure: true, sameSite: "strict" });
          localStorage.removeItem("pig_farm_user");
          localStorage.removeItem("pig_farm_id");
          setAuthHeader(null);
        }
      }

      // Set up Axios interceptor for 401 responses
      const interceptor = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            Cookies.remove("pig_farm_token", { path: "/", secure: true, sameSite: "strict" });
            localStorage.removeItem("pig_farm_user");
            localStorage.removeItem("pig_farm_id");
            setAuthHeader(null);
            setUser(null);
            router.push("/");
          }
          return Promise.reject(error);
        }
      );

      setIsInitialized(true); 

      // Cleanup interceptor on unmount
      return () => {
        axios.interceptors.response.eject(interceptor);
      };
    };

    initializeAuth();
  }, [router]);

  // Restore session from cookies
  useEffect(() => {
    const restoreSession = () => {
      const token = Cookies.get("pig_farm_token");
      const storedUser = localStorage.getItem("pig_farm_user");

      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
          setAuthHeader(token);
          // router.push("/"); // Commented out to avoid unnecessary redirects
        } catch (error) {
          console.error("Failed to restore session:", error);
          Cookies.remove("pig_farm_token", { path: "/", secure: true, sameSite: "strict" });
          localStorage.removeItem("pig_farm_user");
          localStorage.removeItem("pig_farm_id");
        }
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/login`, { email, password });
      if (response.status === 200) {
        const { user, token } = response?.data?.data ?? {};
        const userData: User = {
          email: user?.email ?? "",
          name: user?.name ?? "Farm Administrator",
          farm_id: user?.farm_id ?? "",
          role_id: user?.role_id ?? "",
          email_verified: user?.email_verified ?? false,
          avatar_url: user?.avatar_url ?? ""
        };
        const farmData = await axios.get(`${utils.apiUrl}/farms/${userData.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Store token in cookie with 7-day expiration
        Cookies.set("pig_farm_token", token, { expires: 7, secure: true, sameSite: "strict", path: "/" });
        localStorage.setItem('pig_farm_token', token);
        localStorage.setItem("pig_farm_user", JSON.stringify(userData));
        localStorage.setItem("pig_farm_id", JSON.stringify(userData.farm_id));
        localStorage.setItem("pig_farm_data", JSON.stringify(farmData.data.data));
        setUser(userData);
        setAuthHeader(token);
        router.push("/");
        return { success: true, message: "Login successful", data: { user: userData, token } };
      }
      return { success: false, message: "Invalid email or password" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/register`, { email, password, name, phone });
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
    try {
      // Clear cookies
      Cookies.remove("pig_farm_token", { path: "/", secure: true, sameSite: "strict" });
      const cookies = document.cookie.split("; ");
      for (const cookie of cookies) {
        const [name] = cookie.split("=");
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; SameSite=Strict`;
      }

      // Preserve pig_farm_theme and pig_farm_data
      const theme = localStorage.getItem("pig_farm_theme");
      // const farm = localStorage.getItem("pig_farm_data");
      localStorage.clear();
      if (theme) {
        localStorage.setItem("pig_farm_theme", theme);
      }
      // if (farm) {
      //   localStorage.setItem("pig_farm_data", farm);
      // }
      await clearIndexedDB();
      // Clear user state and auth header
      setUser(null);
      setAuthHeader(null);
      router.push("/");
      return { success: true, message: "Logout successful" };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: getErrorMessage(error) };
    }
  };

  // Helper function to clear IndexedDB
  const clearIndexedDB = async (): Promise<void> => {
    try {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      console.error("Error clearing IndexedDB:", error);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/forgot-password`, { email });
      if (response.status === 200) {
        return { success: true, message: response.data.message || "Password reset email sent" };
      }
      return { success: false, message: "Failed to send password reset email" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const resetPassword = async (params: { token: string; currentPassword: string; newPassword: string }): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/reset-password`, {
        token: params.token,
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
      });
      if (response.status === 200) {
        return { success: true, message: response.data.message || "Password reset successfully" };
      }
      return { success: false, message: "Failed to reset password" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const googleAuth = async (): Promise<AuthResponse> => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          const token = await user.getIdToken(true);
          const userData = {
              user_id: user?.uid ?? uuidv4(),
              email: user.email,
              name: user.displayName,
              image_url: user.photoURL,
              provider: 'google'
          };

          // Send the user data to the backend for verification and session creation
          const response = await axios.post(`${utils.apiUrl}/auth/sso`, userData, {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          });

          if (response.status === 200 || response.status === 201) {
              const { user: backendUser, token } = response?.data?.data ?? {};
              const authUser: User = {
                  email: backendUser?.email ?? user.email ?? '',
                  name: backendUser?.name ?? user.displayName ?? 'Farm Administrator',
                  farm_id: backendUser?.farm_id ?? '',
                  role_id: backendUser?.role_id ?? '',
                  email_verified: backendUser?.email_verified ?? (user.emailVerified ? true : false),
                  avatar_url: backendUser?.avatar_url ?? ''
              };

              const farmData = await axios.get(`${utils.apiUrl}/farms/${authUser.farm_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // Store backend JWT in cookie with 7-day expiration
              Cookies.set('pig_farm_token', token, { expires: 7, secure: true, sameSite: 'strict', path: '/' });
              localStorage.setItem('pig_farm_token', token);
              localStorage.setItem('pig_farm_user', JSON.stringify(authUser));
              localStorage.setItem('pig_farm_id', JSON.stringify(authUser.farm_id));
              localStorage.setItem("pig_farm_data", JSON.stringify(farmData.data.data));
              setUser(authUser);
              setAuthHeader(token);
              router.push('/');

              return { success: true, message: 'Authentication successful', data: { user: authUser, token } };
          }

          return { success: false, message: 'Authentication failed' };
      } catch (error) {
          console.error('Google auth error:', error);
          let message = getErrorMessage(error);
          return { success: false, message };
      }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword, googleAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}