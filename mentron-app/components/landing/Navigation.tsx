'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface NavigationProps {
    sections: Array<{
        id: string;
        label: string;
        color: string;
    }>;
}

export function Navigation({ sections }: NavigationProps) {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                background: 'rgba(10, 10, 10, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold">
                    MENTRON
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className="text-sm uppercase tracking-wider hover:text-primary-cyan transition-colors"
                            style={{
                                textShadow: `0 0 20px ${section.color}40`
                            }}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>

                <Link
                    href="/login"
                    className="btn btn-primary text-sm"
                >
                    Get Started
                </Link>
            </div>
        </motion.nav>
    );
}
