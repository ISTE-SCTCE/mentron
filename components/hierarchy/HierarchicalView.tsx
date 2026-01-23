'use client';

import { useState, useEffect } from 'react';
import { DEPARTMENTS, ACADEMIC_YEARS } from '@/lib/constants';

interface AcademicYear {
    id: string;
    name: string;
    year_number: number;
    is_active: boolean;
}

interface Department {
    id: string;
    code: string;
    name: string;
    color: string;
}

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    member_count: number;
    color: string;
    is_default: boolean;
}

interface HierarchyNode {
    year: AcademicYear;
    departments: {
        department: Department;
        groups: Group[];
    }[];
}

interface HierarchicalViewProps {
    onGroupSelect?: (group: Group) => void;
    onGroupsSelect?: (groups: Group[]) => void;
    selectedGroups?: string[];
    userRole: 'chairman' | 'execom';
    userDepartment?: string;
    onStatsUpdate?: (stats: { years: number; departments: number; groups: number; students: number }) => void;
}

export function HierarchicalView({
    onGroupSelect,
    onGroupsSelect,
    selectedGroups = [],
    userRole,
    userDepartment,
    onStatsUpdate
}: HierarchicalViewProps) {
    const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchHierarchy();
    }, []);

    async function fetchHierarchy() {
        try {
            setLoading(true);

            // Use constants for years and departments
            const years: AcademicYear[] = ACADEMIC_YEARS.map(y => ({
                id: y.value.toString(),
                name: y.label,
                year_number: y.value,
                is_active: true
            }));

            // Use constants for departments
            let departments: Department[] = DEPARTMENTS.map(d => ({
                id: d.code,
                code: d.code,
                name: d.name,
                color: d.color
            }));

            // Filter departments for execom
            if (userRole === 'execom' && userDepartment) {
                departments = departments.filter(d => d.code === userDepartment);
            }

            // Fetch groups from API (groups are dynamic)
            const groupsRes = await fetch('/api/groups');
            const groupsData = await groupsRes.json();
            const groups: Group[] = groupsData.groups || [];

            // Calculate and report stats
            if (onStatsUpdate) {
                onStatsUpdate({
                    years: years.length,
                    departments: departments.length,
                    groups: groups.length,
                    students: groups.reduce((acc, g) => acc + (g.member_count || 0), 0)
                });
            }

            // Build hierarchy
            const hierarchyData: HierarchyNode[] = years.map(year => ({
                year,
                departments: departments.map(dept => ({
                    department: dept,
                    groups: groups.filter(g =>
                        g.year === year.year_number &&
                        g.department === dept.name // Match by Name
                    )
                })).filter(d => d.groups.length > 0 || userRole === 'chairman')
            }));

            setHierarchy(hierarchyData);

            // Auto-expand first year
            if (hierarchyData.length > 0) {
                setExpandedYears(new Set([hierarchyData[0].year.id]));
            }
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleYear(yearId: string) {
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(yearId)) {
                next.delete(yearId);
            } else {
                next.add(yearId);
            }
            return next;
        });
    }

    function toggleDept(deptKey: string) {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptKey)) {
                next.delete(deptKey);
            } else {
                next.add(deptKey);
            }
            return next;
        });
    }

    function handleGroupClick(group: Group) {
        if (onGroupSelect) {
            onGroupSelect(group);
        }
        if (onGroupsSelect) {
            const isSelected = selectedGroups.includes(group.id);
            if (isSelected) {
                onGroupsSelect(selectedGroups.filter(id => id !== group.id).map(id =>
                    hierarchy.flatMap(h => h.departments.flatMap(d => d.groups)).find(g => g.id === id)!
                ));
            } else {
                const allGroups = hierarchy.flatMap(h => h.departments.flatMap(d => d.groups));
                const selected = [...selectedGroups, group.id].map(id => allGroups.find(g => g.id === id)!);
                onGroupsSelect(selected);
            }
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
                        <div className="h-6 w-32 bg-white/10 rounded mb-3" />
                        <div className="pl-4 space-y-2">
                            <div className="h-5 w-24 bg-white/10 rounded" />
                            <div className="h-5 w-28 bg-white/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (hierarchy.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--text-secondary)]">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium">No hierarchy data</p>
                <p className="text-sm mt-1">Run the database migration to set up years and departments</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {hierarchy.map(({ year, departments }) => (
                <div
                    key={year.id}
                    className="rounded-xl border border-[var(--glass-border)] overflow-hidden"
                >
                    {/* Year Header */}
                    <button
                        onClick={() => toggleYear(year.id)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary-cyan/10 to-transparent hover:from-primary-cyan/20 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-primary-cyan/20 flex items-center justify-center transition-transform ${expandedYears.has(year.id) ? 'rotate-90' : ''
                                }`}>
                                <svg className="w-4 h-4 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-[var(--text-primary)]">{year.name}</h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {departments.length} department{departments.length !== 1 ? 's' : ''} •
                                    {departments.reduce((acc, d) => acc + d.groups.length, 0)} group{departments.reduce((acc, d) => acc + d.groups.length, 0) !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        {!year.is_active && (
                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                Inactive
                            </span>
                        )}
                    </button>

                    {/* Departments */}
                    {expandedYears.has(year.id) && (
                        <div className="border-t border-[var(--glass-border)]">
                            {departments.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
                                    No departments with groups
                                </div>
                            ) : (
                                departments.map(({ department, groups }) => {
                                    const deptKey = `${year.id}-${department.id}`;
                                    return (
                                        <div key={deptKey}>
                                            {/* Department Header */}
                                            <button
                                                onClick={() => toggleDept(deptKey)}
                                                className="w-full flex items-center gap-3 p-3 pl-8 hover:bg-white/5 transition-colors"
                                            >
                                                <div
                                                    className="w-6 h-6 rounded flex items-center justify-center"
                                                    style={{ backgroundColor: `${department.color}20` }}
                                                >
                                                    <svg
                                                        className={`w-3 h-3 transition-transform ${expandedDepts.has(deptKey) ? 'rotate-90' : ''}`}
                                                        style={{ color: department.color }}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                                <span
                                                    className="font-medium"
                                                    style={{ color: department.color }}
                                                >
                                                    {department.name}
                                                </span>
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {groups.length} group{groups.length !== 1 ? 's' : ''}
                                                </span>
                                            </button>

                                            {/* Groups */}
                                            {expandedDepts.has(deptKey) && (
                                                <div className="pl-16 pb-2 space-y-1">
                                                    {groups.length === 0 ? (
                                                        <div className="py-2 text-sm text-[var(--text-secondary)]">
                                                            No groups
                                                        </div>
                                                    ) : (
                                                        groups.map(group => (
                                                            <button
                                                                key={group.id}
                                                                onClick={() => handleGroupClick(group)}
                                                                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${selectedGroups.includes(group.id)
                                                                    ? 'bg-primary-cyan/20 ring-1 ring-primary-cyan'
                                                                    : 'hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: group.color }}
                                                                    />
                                                                    <span className="text-sm text-[var(--text-primary)]">
                                                                        {group.name}
                                                                    </span>
                                                                    {group.is_default && (
                                                                        <span className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded">
                                                                            Default
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-[var(--text-secondary)]">
                                                                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
