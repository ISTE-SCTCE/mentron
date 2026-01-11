'use client';

import { useState, useEffect } from 'react';
import { DEPARTMENTS, ACADEMIC_YEARS, getDepartmentColor } from '@/lib/constants';

interface Student {
    id: string;
    email: string;
    name?: string | null;
    department: string;
    year: number;
    created_at: string;
}

interface UnassignedStudentsListProps {
    onStudentsSelect: (studentIds: string[]) => void;
    selectedStudentIds: string[];
    userDepartment?: string;
    onAssignSingle?: (studentId: string) => void;
}

export function UnassignedStudentsList({
    onStudentsSelect,
    selectedStudentIds,
    userDepartment,
    onAssignSingle
}: UnassignedStudentsListProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState<string>(userDepartment || '');
    const [filterYear, setFilterYear] = useState<number | null>(null);

    useEffect(() => {
        fetchUnassigned();
    }, [filterDept, filterYear]);

    async function fetchUnassigned() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterDept) params.append('department', filterDept);
            if (filterYear) params.append('year', filterYear.toString());

            const url = `/api/students/unassigned${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error('Error fetching unassigned students:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleStudent(studentId: string) {
        if (selectedStudentIds.includes(studentId)) {
            onStudentsSelect(selectedStudentIds.filter(id => id !== studentId));
        } else {
            onStudentsSelect([...selectedStudentIds, studentId]);
        }
    }

    function toggleAll() {
        if (selectedStudentIds.length === students.length) {
            onStudentsSelect([]);
        } else {
            onStudentsSelect(students.map(s => s.id));
        }
    }

    function clearFilters() {
        setFilterDept('');
        setFilterYear(null);
    }

    const hasFilters = filterDept || filterYear;

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                {/* Year Filter */}
                <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                        Filter by Year
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterYear(null)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterYear === null
                                ? 'bg-primary-cyan text-white'
                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                }`}
                        >
                            All Years
                        </button>
                        {ACADEMIC_YEARS.map(year => (
                            <button
                                key={year.value}
                                onClick={() => setFilterYear(year.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterYear === year.value
                                    ? 'bg-primary-cyan text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                    }`}
                            >
                                {year.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Department Filter */}
                <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                        Filter by Department
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterDept('')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterDept === ''
                                ? 'bg-secondary-purple text-white'
                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                }`}
                        >
                            All Depts
                        </button>
                        {DEPARTMENTS.map(dept => (
                            <button
                                key={dept.code}
                                onClick={() => setFilterDept(dept.code)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    backgroundColor: filterDept === dept.code ? dept.color : 'rgba(255,255,255,0.05)',
                                    color: filterDept === dept.code ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                {dept.code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clear Filters */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 rounded-lg bg-white/5 animate-pulse">
                            <div className="h-5 w-48 bg-white/10 rounded mb-2" />
                            <div className="h-4 w-32 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && students.length === 0 && (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No Unassigned Students</p>
                    <p className="text-sm mt-1">
                        {hasFilters
                            ? 'No students match the current filters'
                            : 'All students have been assigned to groups'}
                    </p>
                </div>
            )}

            {/* Student List */}
            {!loading && students.length > 0 && (
                <>
                    {/* Header with select all */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={toggleAll}
                            className="text-sm text-primary-cyan hover:underline font-medium"
                        >
                            {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-[var(--text-secondary)]">
                            {selectedStudentIds.length} of {students.length} selected
                        </span>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {students.map(student => (
                            <div
                                key={student.id}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedStudentIds.includes(student.id)
                                    ? 'bg-primary-cyan/20 ring-1 ring-primary-cyan'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {/* Selection Click Area */}
                                <div
                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                    onClick={() => toggleStudent(student.id)}
                                >
                                    {/* Checkbox */}
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedStudentIds.includes(student.id)
                                        ? 'bg-primary-cyan border-primary-cyan'
                                        : 'border-[var(--glass-border)]'
                                        }`}>
                                        {selectedStudentIds.includes(student.id) && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Student info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--text-primary)] truncate">
                                            {student.name || student.email.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">
                                            {student.email}
                                        </p>
                                    </div>

                                    {/* Department badge - Hide on very small screens if needed */}
                                    <div
                                        className="hidden sm:block px-2 py-1 rounded text-xs font-medium"
                                        style={{
                                            backgroundColor: `${getDepartmentColor(student.department)}20`,
                                            color: getDepartmentColor(student.department)
                                        }}
                                    >
                                        {student.department}
                                    </div>

                                    {/* Year - Hide on very small screens */}
                                    <div className="hidden sm:block text-xs text-[var(--text-secondary)] px-2 py-1 bg-white/10 rounded">
                                        Year {student.year}
                                    </div>
                                </div>

                                {/* Individual Assign Button */}
                                {onAssignSingle && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAssignSingle(student.id);
                                        }}
                                        className="p-2 rounded-lg bg-primary-cyan/10 hover:bg-primary-cyan text-primary-cyan hover:text-white transition-colors"
                                        title="Assign to Group"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
