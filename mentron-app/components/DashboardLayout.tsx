'use client';

import { NavigationDock } from './NavigationDock';
import { PagePrefetcher } from './PagePrefetcher';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole: 'student' | 'execom' | 'chairman';
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
            <NavigationDock userRole={userRole} />
            <PagePrefetcher userRole={userRole} />

            {/* Main Content Area - Offset for desktop nav */}
            <div className="lg:!pl-28 !pb-20 lg:!pb-0 transition-all duration-300">
                {children}
            </div>
        </div>
    );
}

