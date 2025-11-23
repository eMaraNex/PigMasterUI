"use client";

import { Toast } from 'primereact/toast';
import { useRef, createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface ToastContextType {
    showToast: (options: any) => void;
    showSuccess: (summary: string, detail?: string) => void;
    showError: (summary: string, detail?: string) => void;
    showWarn: (summary: string, detail?: string) => void;
    showInfo: (summary: string, detail?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);

    // Return no-op functions if context is null (not within provider)
    if (!context) {
        return {
            showToast: () => { },
            showSuccess: () => { },
            showError: () => { },
            showWarn: () => { },
            showInfo: () => { }
        };
    }

    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const toast = useRef<Toast>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const showToast = (options: any) => {
        if (isClient && toast.current) {
            toast.current.show(options);
        }
    };

    const showSuccess = (summary: string, detail?: string) => {
        showToast({ severity: 'success', summary, detail, life: 5000 });
    };

    const showError = (summary: string, detail?: string) => {
        showToast({ severity: 'error', summary, detail, life: 5000 });
    };

    const showWarn = (summary: string, detail?: string) => {
        showToast({ severity: 'warn', summary, detail, life: 5000 });
    };

    const showInfo = (summary: string, detail?: string) => {
        showToast({ severity: 'info', summary, detail, life: 5000 });
    };

    if (!isClient) {
        return <>{children}</>;
    }

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarn, showInfo }}>
            <Toast ref={toast} position="top-center" />
            {children}
        </ToastContext.Provider>
    );
}