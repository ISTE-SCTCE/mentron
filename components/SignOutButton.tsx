'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Static spinner icon
const SpinnerIcon = (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

// Static logout icon
const LogoutIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export function SignOutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    return (
        <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-medium transition-all disabled:opacity-50"
        >
            {loading ? (
                <>
                    {SpinnerIcon}
                    Signing out...
                </>
            ) : (
                <>
                    {LogoutIcon}
                    Sign Out
                </>
            )}
        </button>
    );
}

