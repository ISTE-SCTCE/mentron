'use client';

import { useState, useEffect } from 'react';

interface AcademicYear {
    id: string;
    name: string;
    year_number: number;
    is_active: boolean;
    department_count?: number;
}

interface YearSelectorProps {
    selectedYearId: string | null;
    onYearChange: (yearId: string | null, yearNumber: number | null) => void;
    showAll?: boolean;
    className?: string;
}

export function YearSelector({
    selectedYearId,
    onYearChange,
    showAll = true,
    className = ''
}: YearSelectorProps) {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchYears() {
            try {
                const res = await fetch('/api/academic-years');
                if (res.ok) {
                    const data = await res.json();
                    setYears(data.years || []);
                }
            } catch (error) {
                console.error('Error fetching years:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchYears();
    }, []);

    if (loading) {
        return (
            <div className={`flex gap-2 ${className}`}>
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="h-10 w-28 bg-white/5 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {showAll && (
                <button
                    onClick={() => onYearChange(null, null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedYearId === null
                            ? 'bg-primary-cyan text-white shadow-lg shadow-primary-cyan/25'
                            : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                        }`}
                >
                    All Years
                </button>
            )}
            {years.map((year) => (
                <button
                    key={year.id}
                    onClick={() => onYearChange(year.id, year.year_number)}
                    disabled={!year.is_active}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedYearId === year.id
                            ? 'bg-primary-cyan text-white shadow-lg shadow-primary-cyan/25'
                            : year.is_active
                                ? 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                : 'bg-white/5 text-[var(--text-secondary)]/50 cursor-not-allowed'
                        }`}
                >
                    <span>{year.name}</span>
                    {year.department_count !== undefined && year.department_count > 0 && (
                        <span className="ml-2 text-xs opacity-60">
                            ({year.department_count})
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
