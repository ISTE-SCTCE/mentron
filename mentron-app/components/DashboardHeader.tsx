'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import { useToast } from '@/lib/context/ToastContext';

interface DashboardHeaderProps {
    userName: string;
    subtitle: string;
    userRole: 'student' | 'execom' | 'chairman';
    onSignOut?: () => void;
}

// Static Features Index with Role Access
const APP_FEATURES = [
    // Chairman Features
    { name: 'Dashboard', path: '/chairman', roles: ['chairman'] },
    { name: 'Analytics', path: '/chairman/analytics', roles: ['chairman'] },
    { name: 'Student List', path: '/chairman/students', roles: ['chairman'] },
    { name: 'Settings', path: '/chairman/settings', roles: ['chairman'] },
    { name: 'Notifications', path: '/chairman/notifications', roles: ['chairman'] },
    { name: 'Groups', path: '/chairman/groups', roles: ['chairman'] },

    // Execom Features
    { name: 'Dashboard', path: '/execom', roles: ['execom'] },
    { name: 'Upload Material', path: '/execom/upload', roles: ['execom', 'chairman'] },
    { name: 'Student List', path: '/execom/students', roles: ['execom'] },
    { name: 'Settings', path: '/execom/settings', roles: ['execom'] },
    { name: 'Notifications', path: '/execom/notifications', roles: ['execom'] },

    // Student Features
    { name: 'Dashboard', path: '/student', roles: ['student'] },
    { name: 'My Materials', path: '/student/materials', roles: ['student'] },
    { name: 'Calendar', path: '/student/calendar', roles: ['student'] },
    { name: 'Notifications', path: '/student/notifications', roles: ['student'] },
    { name: 'Settings', path: '/student/settings', roles: ['student'] },
];

export function DashboardHeader({ userName, subtitle, userRole, onSignOut }: DashboardHeaderProps) {
    const [greeting, setGreeting] = useState('Hello');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        features: any[];
        materials: any[];
        groups: any[];
        students: any[];
    }>({ features: [], materials: [], groups: [], students: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults({ features: [], materials: [], groups: [], students: [] });
                return;
            }

            setIsSearching(true);
            setShowResults(true);

            // 1. Search Static Features (Filtered by Role)
            const filteredFeatures = APP_FEATURES.filter(f =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                f.roles.includes(userRole)
            );

            // 2. Search Dynamic Data via API
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();

                setSearchResults({
                    features: filteredFeatures,
                    materials: data.materials || [],
                    groups: data.groups || [],
                    students: data.students || []
                });
            } catch (error) {
                console.error("Search failed", error);
                // Fallback to just features on error
                setSearchResults({ features: filteredFeatures, materials: [], groups: [], students: [] });
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(handleSearch, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, userRole]);

    const handleResultClick = (path: string) => {
        router.push(path);
        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <div className="flex flex-col gap-6 mb-8 md:mb-10 lg:mb-12">
            {/* Top Row - Greeting and Sign Out */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h2 className="!text-2xl sm:!text-3xl md:!text-4xl font-bold mb-1 truncate text-[var(--text-primary)]">
                        {greeting}, {userName}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">{subtitle}</p>
                </div>
            </div>

            {/* Bottom Row - Search and Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-4 relative z-50 h-[44px]">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md" ref={searchRef}>
                    <AnimatedSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onFocus={() => searchQuery && setShowResults(true)}
                        placeholder="Search features, materials, groups..."
                    />

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
                            {/* Loading Indicator */}
                            {isSearching && (
                                <div className="p-4 flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5 text-primary-cyan" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-[var(--text-secondary)]">Searching...</span>
                                </div>
                            )}
                            {searchResults.features.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Features</div>
                                    {searchResults.features.map((item, idx) => (
                                        <button key={idx} onClick={() => handleResultClick(item.path)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                            <svg className="w-4 h-4 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary-cyan">{item.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Groups */}
                            {searchResults.groups.length > 0 && (
                                <div className="p-2 border-t border-[var(--glass-border)]">
                                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Groups</div>
                                    {searchResults.groups.map((item) => (
                                        <button key={item.id} onClick={() => handleResultClick(`/chairman/groups/${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                            <svg className="w-4 h-4 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-secondary-purple">{item.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Materials */}
                            {searchResults.materials.length > 0 && (
                                <div className="p-2 border-t border-[var(--glass-border)]">
                                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Materials</div>
                                    {searchResults.materials.map((item) => (
                                        <button key={item.id} onClick={() => handleResultClick(`/chairman/materials/${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                            <svg className="w-4 h-4 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-accent-pink">{item.title}</span>
                                            <span className="text-xs text-[var(--text-secondary)] ml-auto">{item.subject}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Students */}
                            {searchResults.students.length > 0 && (
                                <div className="p-2 border-t border-[var(--glass-border)]">
                                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Students</div>
                                    {searchResults.students.map((item) => (
                                        <button key={item.id} onClick={() => handleResultClick(`/${userRole}/students?highlight=${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-cyan to-secondary-purple flex items-center justify-center text-xs font-bold text-white">
                                                {(item.name || item.email)?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary-cyan truncate block">{item.name || item.email}</span>
                                                <span className="text-xs text-[var(--text-secondary)] truncate block">{item.department} • Year {item.year}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {!isSearching && !searchResults.features.length && !searchResults.materials.length && !searchResults.groups.length && !searchResults.students.length && (
                                <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Icons - Aligned */}
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications - Now a Link */}
                    <Link
                        href={`/${userRole}/notifications`}
                        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-[var(--text-primary)]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-accent-pink rounded-full"></span>
                    </Link>
                </div>
            </div>

            {/* Mobile Header Row */}
            <div className="md:hidden relative mb-4" ref={searchRef}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                        <AnimatedSearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onFocus={() => searchQuery && setShowResults(true)}
                            placeholder="Search..."
                        />
                    </div>
                    <div className="flex-shrink-0">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile Search Results Dropdown */}
                {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
                        {/* Loading Indicator */}
                        {isSearching && (
                            <div className="p-4 flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5 text-primary-cyan" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm text-[var(--text-secondary)]">Searching...</span>
                            </div>
                        )}
                        {searchResults.features.length > 0 && (
                            <div className="p-2">
                                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Features</div>
                                {searchResults.features.map((item, idx) => (
                                    <button key={idx} onClick={() => handleResultClick(item.path)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                        <svg className="w-4 h-4 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary-cyan">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Groups */}
                        {searchResults.groups.length > 0 && (
                            <div className="p-2 border-t border-[var(--glass-border)]">
                                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Groups</div>
                                {searchResults.groups.map((item) => (
                                    <button key={item.id} onClick={() => handleResultClick(`/chairman/groups/${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                        <svg className="w-4 h-4 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-secondary-purple">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Materials */}
                        {searchResults.materials.length > 0 && (
                            <div className="p-2 border-t border-[var(--glass-border)]">
                                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Materials</div>
                                {searchResults.materials.map((item) => (
                                    <button key={item.id} onClick={() => handleResultClick(`/${userRole}/materials/${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                        <svg className="w-4 h-4 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-accent-pink">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Students */}
                        {searchResults.students.length > 0 && (
                            <div className="p-2 border-t border-[var(--glass-border)]">
                                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 py-1">Students</div>
                                {searchResults.students.map((item) => (
                                    <button key={item.id} onClick={() => handleResultClick(`/${userRole}/students?highlight=${item.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-cyan to-secondary-purple flex items-center justify-center text-xs font-bold text-white">
                                            {(item.name || item.email)?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary-cyan truncate block">{item.name || item.email}</span>
                                            <span className="text-xs text-[var(--text-secondary)] truncate block">{item.department} • Year {item.year}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isSearching && !searchResults.features.length && !searchResults.materials.length && !searchResults.groups.length && !searchResults.students.length && (
                            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
                                No results found for &quot;{searchQuery}&quot;
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
