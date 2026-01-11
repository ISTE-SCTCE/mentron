'use client';

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './LoadingSkeleton';

/**
 * Lazy-loaded heavy components
 * These are loaded only when needed to reduce initial bundle size
 */

/**
 * Lazy-loaded Calendar Widget
 */
export const LazyCalendarWidget = dynamic(
    () => import('./CalendarWidget').then(mod => ({ default: mod.CalendarWidget })),
    {
        loading: () => <LoadingSkeleton type="chart" />,
        ssr: false,
    }
);

/**
 * Lazy-loaded Notifications Panel
 */
export const LazyNotificationsPanel = dynamic(
    () => import('./NotificationsPanel').then(mod => ({ default: mod.NotificationsPanel })),
    {
        loading: () => <LoadingSkeleton type="list" />,
        ssr: false,
    }
);

/**
 * Lazy-loaded Students Client (heavy DnD component)
 */
export const LazyStudentsClient = dynamic(
    () => import('./StudentsClient').then(mod => ({ default: mod.StudentsClient })),
    {
        loading: () => <LoadingSkeleton type="full" />,
        ssr: false,
    }
);

/**
 * Lazy-loaded Settings Client
 */
export const LazySettingsClient = dynamic(
    () => import('./SettingsClient').then(mod => ({ default: mod.SettingsClient })),
    {
        loading: () => <LoadingSkeleton type="card" />,
        ssr: false,
    }
);

/**
 * Lazy-loaded Add Admin Button (with modal)
 */
export const LazyAddAdminButton = dynamic(
    () => import('./AddAdminButton').then(mod => ({ default: mod.AddAdminButton })),
    {
        loading: () => <div className="h-10 w-32 animate-pulse bg-white/5 rounded-lg" />,
        ssr: false,
    }
);
