'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * StudentSearchDropdown - Specialized student search with PREFIX matching
 * 
 * IMPORTANT: Unlike the dashboard search which matches anywhere in content,
 * this search ONLY matches student names that START WITH the entered letters.
 * 
 * Example: Typing "Jo" will match "John Smith" and "Jordan Lee" but NOT "Mary Johnson"
 * 
 * Features:
 * - Prefix-based name matching (starts with)
 * - 300ms debounce for performance
 * - Keyboard navigation (arrow keys, enter, escape)
 * - ARIA labels for accessibility
 * - Loading states
 */

interface Student {
    id: string;
    name: string | null;
    email: string;
    department: string;
    year: number;
    roll_number: string | null;
    group_id: string | null;
}

interface StudentSearchDropdownProps {
    onSelectStudent?: (student: Student) => void;
    onFilterChange?: (students: Student[]) => void;
    placeholder?: string;
    className?: string;
}

export function StudentSearchDropdown({
    onSelectStudent,
    onFilterChange,
    placeholder = "Search students by name (prefix match)...",
    className = ""
}: StudentSearchDropdownProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            onFilterChange?.([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({ q: searchQuery });
                const res = await fetch(`/api/students/search?${params}`);

                if (!res.ok) {
                    throw new Error('Search failed');
                }

                const data = await res.json();
                setResults(data.students || []);
                setIsOpen(true);
                setHighlightedIndex(-1);
                onFilterChange?.(data.students || []);
            } catch (err) {
                console.error('Student search error:', err);
                setError('Failed to search students');
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, onFilterChange]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleSelect = useCallback((student: Student) => {
        onSelectStudent?.(student);
        setSearchQuery(student.name || student.email);
        setIsOpen(false);
    }, [onSelectStudent]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && results[highlightedIndex]) {
                    handleSelect(results[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    }, [isOpen, highlightedIndex, results, handleSelect]);

    const handleClear = () => {
        setSearchQuery('');
        setResults([]);
        setIsOpen(false);
        onFilterChange?.([]);
        inputRef.current?.focus();
    };

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="student-search-results"
        >
            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && results.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pl-11 pr-10 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all text-[var(--text-primary)]"
                    aria-label="Search students by name prefix"
                    aria-autocomplete="list"
                    aria-controls="student-search-results"
                />
                {/* Search Icon */}
                <svg
                    className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin w-5 h-5 text-primary-cyan" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}

                {/* Clear Button */}
                {searchQuery && !isLoading && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Clear search"
                    >
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Search Hint */}
            <p className="text-xs text-text-secondary mt-1 px-1">
                💡 Tip: This search matches names that <strong>start with</strong> your query
            </p>

            {/* Results Dropdown */}
            {isOpen && (
                <div
                    id="student-search-results"
                    role="listbox"
                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-[var(--deep-bg)] border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                >
                    {/* Error State */}
                    {error && (
                        <div className="p-4 text-center text-accent-pink text-sm">
                            {error}
                        </div>
                    )}

                    {/* Results List */}
                    {!error && results.length > 0 && (
                        <div className="p-1">
                            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-3 py-2">
                                Students starting with &quot;{searchQuery}&quot;
                            </div>
                            {results.map((student, index) => (
                                <button
                                    key={student.id}
                                    role="option"
                                    aria-selected={highlightedIndex === index}
                                    onClick={() => handleSelect(student)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${highlightedIndex === index
                                        ? 'bg-primary-cyan/20'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-cyan to-secondary-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                        {(student.name || student.email)?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {student.name || student.email}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] truncate">
                                            {student.roll_number && `${student.roll_number} • `}
                                            Year {student.year}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!error && !isLoading && results.length === 0 && searchQuery && (
                        <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            No students found starting with &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
