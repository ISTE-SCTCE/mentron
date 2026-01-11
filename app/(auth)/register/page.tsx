'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE'];
    const years = [1, 2, 3, 4];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate Gmail only
        if (!email.endsWith('@gmail.com')) {
            setError('Only Gmail accounts are allowed');
            setLoading(false);
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // Create auth user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                // Handle duplicate email specifically
                if (signUpError.message.includes('already registered') ||
                    signUpError.message.includes('already exists') ||
                    signUpError.message.includes('User already registered')) {
                    throw new Error('This email is already registered. Please login instead.');
                }
                throw signUpError;
            }

            if (authData.user) {
                // Create student profile
                const { error: profileError } = await supabase
                    .from('group_members')
                    .insert({
                        id: authData.user.id,
                        email,
                        department,
                        year: parseInt(year),
                        name,
                        roll_number: rollNumber,
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // If profile creation fails, clean up auth user
                    await supabase.auth.signOut();
                    throw new Error(`Failed to create profile: ${profileError.message}`);
                }

                // Successfully created - redirect to student dashboard
                router.push('/student');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account');
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="glass-card fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">Join Mentron</h1>
                        <p className="text-text-secondary">Create your student account</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-lg bg-accent-pink/10 border border-accent-pink/20">
                                <p className="text-accent-pink text-sm">{error}</p>
                                {error.includes('already registered') && (
                                    <Link
                                        href="/login"
                                        className="text-primary-cyan hover:underline text-sm mt-2 inline-block font-medium"
                                    >
                                        → Go to Login Page
                                    </Link>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="rollNumber" className="block text-sm font-medium mb-2">
                                Roll Number
                            </label>
                            <input
                                id="rollNumber"
                                type="text"
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                placeholder="e.g. 2023ECE001"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Gmail Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@gmail.com"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium mb-2">
                                    Department
                                </label>
                                <select
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                >
                                    <option value="">Select</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept} className="bg-deep-bg">
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="year" className="block text-sm font-medium mb-2">
                                    Year
                                </label>
                                <select
                                    id="year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                >
                                    <option value="">Select</option>
                                    {years.map((yr) => (
                                        <option key={yr} value={yr} className="bg-deep-bg">
                                            Year {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
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

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-cyan hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
