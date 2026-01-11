'use client';

import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

interface HierarchyBreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function HierarchyBreadcrumb({ items, className = '' }: HierarchyBreadcrumbProps) {
    return (
        <nav className={`flex items-center gap-2 text-sm ${className}`}>
            {/* Home Icon */}
            <Link
                href="/chairman"
                className="text-[var(--text-secondary)] hover:text-primary-cyan transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {/* Separator */}
                    <svg className="w-4 h-4 text-[var(--text-secondary)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Breadcrumb Item */}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-primary-cyan transition-colors"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                            {item.icon}
                            <span>{item.label}</span>
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
