"use client";

import { SnackbarProvider } from 'notistack';
import type { JSX, ReactNode } from 'react';

interface NotistackProviderProps {
    children: ReactNode;
}

/**
 * NotistackProvider component to wrap the app with snackbar functionality.
 * @param {NotistackProviderProps} props - Component props
 * @returns {JSX.Element} SnackbarProvider with children
 */
export default function NotistackProvider({ children }: NotistackProviderProps): JSX.Element {
    try {
        if (children === undefined || children === null) {
            throw new Error('NotistackProvider: Children prop is required and cannot be null or undefined');
        }

        return (
            <SnackbarProvider
                maxSnack={3}
                autoHideDuration={3000}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                preventDuplicate
            >
                {children}
            </SnackbarProvider>
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in NotistackProvider';
        console.error('NotistackProvider error:', errorMessage);
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <p>Error initializing snackbar provider: {errorMessage}</p>
                {children}
            </div>
        );
    }
}
