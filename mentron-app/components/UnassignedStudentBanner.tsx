'use client';

/**
 * UnassignedStudentBanner - Clear messaging for students awaiting group assignment
 * 
 * Displays a prominent banner with:
 * - Clear status message
 * - Visual pulse animation to indicate waiting
 * - Contact information for coordinators
 */

interface UnassignedStudentBannerProps {
    studentName?: string | null;
    department?: string;
}

export function UnassignedStudentBanner({ studentName, department }: UnassignedStudentBannerProps) {
    return (
        <div className="mb-8 animate-fade-in">
            {/* Main Banner */}
            <div className="glass-card border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-transparent overflow-hidden relative">
                {/* Animated pulse background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent animate-pulse"></div>

                <div className="relative flex items-start gap-4 sm:gap-6">
                    {/* Icon with pulse */}
                    <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center">
                            <svg
                                className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/50 animate-ping"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <span>Awaiting Group Assignment</span>
                            <span className="inline-flex w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                        </h3>

                        <p className="text-[var(--text-primary)] text-sm sm:text-base mb-3">
                            {studentName ? (
                                <>Hi <span className="font-semibold">{studentName}</span>! </>
                            ) : null}
                            You are currently not assigned to any group. Once an administrator assigns you to a group,
                            you'll have full access to:
                        </p>

                        {/* Access list */}
                        <ul className="text-[var(--text-secondary)] text-sm space-y-1 mb-4">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-500/70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Study materials for your department and year</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-500/70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Group announcements and notifications</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-500/70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Collaborative features with your peers</span>
                            </li>
                        </ul>

                        {/* Contact info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {department ? (
                                    <span>Contact your <strong>{department}</strong> coordinator if this takes too long.</span>
                                ) : (
                                    <span>Contact your department coordinator if this takes too long.</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Locked Card */}
            <div className="mt-6 glass-card text-center py-12 sm:py-16 opacity-60">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--text-primary)]">
                    Content Locked
                </h3>
                <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-md mx-auto">
                    Study materials and group resources will become available once you've been assigned to a group.
                </p>
            </div>
        </div>
    );
}
