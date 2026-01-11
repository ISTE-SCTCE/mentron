'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
}

interface NavigationDockProps {
    userRole: 'student' | 'execom' | 'chairman';
}

export function NavigationDock({ userRole }: NavigationDockProps) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const response = await fetch('/api/notifications');
                const data = await response.json();
                setUnreadCount(data.unreadCount || 0);
            } catch (error) {
                console.error('Failed to fetch notification count:', error);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const { navItems, bottomItems, allItems } = useMemo(() => {
        const commonItems: NavItem[] = [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                ),
                href: `/${userRole === 'execom' ? 'execom' : userRole}`,
            },
            {
                id: 'materials',
                label: 'Materials',
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                ),
                href: `/${userRole}/materials`,
            },
        ];

        let topItems: NavItem[];

        if (userRole === 'chairman') {
            topItems = [
                ...commonItems.slice(0, 1),
                {
                    id: 'analytics',
                    label: 'Analytics',
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    ),
                    href: '/chairman/analytics',
                },
                {
                    id: 'students',
                    label: 'Groups',
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    ),
                    href: '/chairman/students',
                },
                {
                    id: 'upload',
                    label: 'Upload',
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    ),
                    href: '/chairman/upload',
                },
                ...commonItems.slice(1),
            ];
        } else if (userRole === 'execom') {
            topItems = [
                ...commonItems,
                {
                    id: 'students',
                    label: 'Groups',
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    ),
                    href: '/execom/students',
                },
                {
                    id: 'upload',
                    label: 'Upload',
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    ),
                    href: '/execom/upload',
                },
            ];
        } else {
            topItems = commonItems;
        }

        const bottom: NavItem[] = [
            {
                id: 'calendar',
                label: 'Calendar',
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                href: `/${userRole}/calendar`,
            },
            {
                id: 'notifications',
                label: 'Notifications',
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                ),
                href: `/${userRole}/notifications`,
                badge: unreadCount > 0 ? unreadCount : undefined,
            },
            {
                id: 'settings',
                label: userRole === 'chairman' ? 'Settings' : 'Profile',
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {userRole === 'chairman' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                    </svg>
                ),
                href: `/${userRole}/settings`,
            },
        ];

        return {
            navItems: topItems,
            bottomItems: bottom,
            allItems: [...topItems, ...bottom]
        };
    }, [userRole, unreadCount]);

    const activeId = useMemo(() => {
        let bestMatch = null;
        let bestScore = 0;

        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            let score = 0;

            if (pathname === item.href) {
                score = item.href.length + 1000;
            } else if (pathname.startsWith(item.href)) {
                score = item.href.length;
            }

            if (item.id === 'dashboard' && pathname !== item.href) {
                score = 0;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = item.id;
            }
        }

        return bestMatch;
    }, [pathname, allItems]);

    const renderDesktopItem = (item: NavItem) => {
        const active = item.id === activeId;
        return (
            <Link
                key={item.id}
                href={item.href}
                className="relative group hover:scale-[1.2]"
                style={{
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${active
                        ? 'bg-primary-cyan text-background shadow-lg shadow-primary-cyan/50'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary'
                        }`}
                >
                    <div className="w-6 h-6">{item.icon}</div>
                    {item.badge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-pink rounded-full text-xs font-bold flex items-center justify-center">
                            {item.badge}
                        </span>
                    )}
                </div>

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-background border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-background"></div>
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Navigation Dock */}
            <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-nav-bg backdrop-blur-xl border-r border-nav-border z-50">
                {/* Top Items */}
                <div className="flex-1 flex flex-col items-center gap-2">
                    {navItems.map(renderDesktopItem)}
                </div>

                {/* Bottom Items */}
                <div className="flex flex-col items-center gap-2 mt-auto">
                    <div className="w-10 h-px bg-white/10 mb-2"></div>
                    {bottomItems.map(renderDesktopItem)}
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <MobileNavigation
                dashboardItem={allItems.find(i => i.id === 'dashboard')!}
                settingsItem={allItems.find(i => i.id === 'settings')!}
                otherItems={allItems.filter(i => i.id !== 'dashboard' && i.id !== 'settings')}
                activeId={activeId}
            />
        </>
    );
}

function MobileNavigation({
    dashboardItem,
    settingsItem,
    otherItems,
    activeId
}: {
    dashboardItem: NavItem;
    settingsItem: NavItem;
    otherItems: NavItem[];
    activeId: string | null;
}) {
    const [showMore, setShowMore] = useState(false);

    return (
        <>
            {/* More Menu Backdrop */}
            {showMore && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Menu Popup */}
            <div
                className={`fixed bottom-20 left-4 right-4 bg-[#0A0A0F]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 grid grid-cols-4 gap-4 z-[60] lg:hidden transition-all duration-300 origin-bottom ${showMore ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                {otherItems.map((item) => {
                    const active = item.id === activeId;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setShowMore(false)}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-primary-cyan text-background' : 'bg-white/5 text-text-secondary'
                                }`}>
                                <div className="w-6 h-6">{item.icon}</div>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${active ? 'text-primary-cyan' : 'text-text-secondary'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Mobile Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-nav-bg backdrop-blur-xl border-t border-nav-border z-50 mobile-nav-safe">
                <div className="h-full flex items-center justify-around px-6">
                    {/* Dashboard Tab */}
                    <Link
                        href={dashboardItem.href}
                        className={`flex flex-col items-center gap-1 p-2 ${dashboardItem.id === activeId ? 'text-primary-cyan' : 'text-text-secondary'
                            }`}
                        onClick={() => setShowMore(false)}
                    >
                        <div className="w-6 h-6">{dashboardItem.icon}</div>
                        <span className="text-xs font-medium">Home</span>
                    </Link>

                    {/* More Tab - Centered */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center gap-1 p-2 -mt-6 ${showMore || otherItems.some(i => i.id === activeId) ? 'text-primary-cyan' : 'text-text-secondary'
                            }`}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ${showMore ? 'bg-primary-cyan text-background rotate-45' : 'bg-[#1A1A24] border border-white/10 text-current'
                            } ${otherItems.some(i => i.id === activeId) && !showMore ? 'border-primary-cyan text-primary-cyan' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium">More</span>
                    </button>

                    {/* Settings Tab */}
                    <Link
                        href={settingsItem.href}
                        className={`flex flex-col items-center gap-1 p-2 ${settingsItem.id === activeId ? 'text-primary-cyan' : 'text-text-secondary'
                            }`}
                        onClick={() => setShowMore(false)}
                    >
                        <div className="w-6 h-6">{settingsItem.icon}</div>
                        <span className="text-xs font-medium">Settings</span>
                    </Link>
                </div>
            </nav>
        </>
    );
}
