'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PagePrefetcherProps {
    userRole: 'student' | 'execom' | 'chairman';
}

/**
 * Prefetches dashboard pages on initial load for faster navigation
 * Uses Next.js router.prefetch() to preload pages in the background
 */
export function PagePrefetcher({ userRole }: PagePrefetcherProps) {
    const router = useRouter();

    useEffect(() => {
        // Define pages to prefetch based on user role
        const pagesToPrefetch: string[] = [];

        if (userRole === 'student') {
            pagesToPrefetch.push(
                '/student',
                '/student/materials',
                '/student/calendar',
                '/student/notifications',
                '/student/settings'
            );
        } else if (userRole === 'execom') {
            pagesToPrefetch.push(
                '/execom',
                '/execom/students',
                '/execom/upload',
                '/execom/notifications',
                '/execom/settings'
            );
        } else if (userRole === 'chairman') {
            pagesToPrefetch.push(
                '/chairman',
                '/chairman/students',
                '/chairman/analytics',
                '/chairman/upload',
                '/chairman/notifications',
                '/chairman/settings'
            );
        }

        // Prefetch all pages with a small delay to not block initial render
        const timeoutId = setTimeout(() => {
            pagesToPrefetch.forEach((path) => {
                router.prefetch(path);
            });
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [router, userRole]);

    // This component doesn't render anything
    return null;
}
