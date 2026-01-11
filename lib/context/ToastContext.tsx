'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '@/components/ui/Toast';

interface ToastContextType {
    showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ message: string; duration?: number } | null>(null);

    const showToast = useCallback((message: string, duration: number = 3000) => {
        setToast({ message, duration });
    }, []);

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    duration={toast.duration}
                    onClose={closeToast}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
