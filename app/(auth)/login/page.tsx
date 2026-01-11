'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CONFIG } from '@/lib/config/auth';
import { useToast } from '@/lib/context/ToastContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // const [error, setError] = useState(''); // Removed local error state
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    // Redirect if already logged in (Fixes Back button showing Login page)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Determine role and redirect (simplified check for speed)
                router.replace('/');
            }
        };
        checkSession();
    }, [router, supabase]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // setError('');
        setLoading(true);

        // Validate Gmail only
        if (!email.endsWith('@gmail.com')) {
            showToast('Only Gmail accounts are allowed');
            setLoading(false);
            return;
        }

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                // Check user role and redirect accordingly
                const { data: adminData } = await supabase
                    .from('admins')
                    .select('role, is_active')
                    .eq('id', data.user.id)
                    .single();

                if (adminData) {
                    if (!adminData.is_active) {
                        await supabase.auth.signOut();
                        showToast('Your account has been deactivated. Please contact the chairman.');
                        setLoading(false);
                        return;
                    }

                    if (adminData.role === 'chairman') {
                        router.replace('/chairman');
                    } else {
                        router.replace('/execom');
                    }
                } else {
                    // Check if student
                    const { data: studentData } = await supabase
                        .from('group_members')
                        .select('id')
                        .eq('id', data.user.id)
                        .single();

                    if (studentData) {
                        router.replace('/student');
                    } else {
                        await supabase.auth.signOut();
                        showToast('User profile not found. Please contact support.');
                        setLoading(false);
                    }
                }
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Background glow effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-cyan/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-purple/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-cyan to-secondary-purple mb-4 shadow-lg shadow-primary-cyan/25">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-text-secondary text-sm sm:text-base">
                        Sign in to access your Mentron dashboard
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card fade-in p-6 sm:p-8">
                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                                Gmail Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@gmail.com"
                                    required
                                    autoComplete="email"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 
                                               text-text-primary placeholder:text-text-secondary/50
                                               focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 
                                               transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 
                                               text-text-primary placeholder:text-text-secondary/50
                                               focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 
                                               transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary-cyan transition-colors p-1 rounded-lg hover:bg-white/5"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link - Centered if alone, or right aligned */}
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-primary-cyan hover:text-cyan-300 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wide
                                       bg-gradient-to-r from-primary-cyan to-cyan-400 text-deep-bg
                                       hover:shadow-lg hover:shadow-primary-cyan/30 hover:scale-[1.02]
                                       focus:outline-none focus:ring-2 focus:ring-primary-cyan/50 focus:ring-offset-2 focus:ring-offset-deep-bg
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                       transition-all duration-200 touch-manipulation"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-deep-bg text-text-secondary">New to Mentron?</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <Link
                        href="/register"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                                   bg-white/5 border border-white/10 text-text-primary
                                   hover:bg-white/10 hover:border-white/20
                                   focus:outline-none focus:ring-2 focus:ring-primary-cyan/30
                                   transition-all duration-200 text-sm font-medium touch-manipulation"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Register as Student
                    </Link>
                </div>

                {/* Back to Dashboard Link */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                   text-text-secondary hover:text-primary-cyan 
                                   hover:bg-white/5 transition-all duration-200 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>

                {/* Mobile safe area padding */}
                <div className="h-8 sm:h-0 mobile-nav-safe" />
            </div >
        </main >
    );
}
