'use client';

import { useState } from 'react';
import {
    YearSelector,
    DepartmentSelector,
    HierarchyBreadcrumb,
    HierarchicalView,
    GroupTransferModal,
    CreateGroupModal
} from '@/components/hierarchy';

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    member_count?: number;
    color?: string;
}

interface HierarchyClientProps {
    userRole: 'chairman' | 'execom';
    userDepartment?: string;
}

export function HierarchyClient({ userRole, userDepartment }: HierarchyClientProps) {
    const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
    const [selectedYearNumber, setSelectedYearNumber] = useState<number | null>(null);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [stats, setStats] = useState({ years: 0, departments: 0, groups: 0, students: 0 });

    function handleYearChange(yearId: string | null, yearNumber: number | null) {
        setSelectedYearId(yearId);
        setSelectedYearNumber(yearNumber);
        setSelectedDeptId(null);
        setSelectedDeptCode(null);
        setSelectedGroups([]);
    }

    function handleDepartmentChange(deptId: string | null, deptCode: string | null) {
        setSelectedDeptId(deptId);
        setSelectedDeptCode(deptCode);
        setSelectedGroups([]);
    }

    function handleGroupsSelect(groups: Group[]) {
        setSelectedGroups(groups);
    }

    function handleTransferComplete() {
        setSelectedGroups([]);
        setRefreshKey(prev => prev + 1);
    }

    function handleGroupCreated() {
        setRefreshKey(prev => prev + 1);
    }

    // Build breadcrumb items
    const breadcrumbItems = [];
    if (selectedYearNumber) {
        breadcrumbItems.push({
            label: `Year ${selectedYearNumber}`,
            href: selectedDeptCode ? undefined : undefined,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        });
    }
    if (selectedDeptCode) {
        breadcrumbItems.push({
            label: selectedDeptCode,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                        Student Hierarchy
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Manage years, departments, and groups
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedGroups.length > 0 && (
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary-purple hover:bg-secondary-purple/80 text-white rounded-lg font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transfer {selectedGroups.length}
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Group
                    </button>
                </div>
            </div>

            {/* Breadcrumb */}
            {breadcrumbItems.length > 0 && (
                <HierarchyBreadcrumb items={breadcrumbItems} />
            )}

            {/* Filters */}
            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Filter by Year
                    </label>
                    <YearSelector
                        selectedYearId={selectedYearId}
                        onYearChange={handleYearChange}
                    />
                </div>

                {selectedYearId && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Filter by Department
                        </label>
                        <DepartmentSelector
                            selectedDeptId={selectedDeptId}
                            onDepartmentChange={handleDepartmentChange}
                            yearId={selectedYearId}
                        />
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-cyan/10 to-transparent border border-primary-cyan/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-cyan/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.years}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Years</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary-purple/10 to-transparent border border-secondary-purple/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary-purple/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.departments}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Departments</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-accent-pink/10 to-transparent border border-accent-pink/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-pink/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.groups}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Groups</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.students}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hierarchical Tree View */}
            <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <h2 className="font-semibold text-[var(--text-primary)]">
                        Hierarchy Structure
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-secondary)]">
                            {selectedGroups.length} selected
                        </span>
                        {selectedGroups.length > 0 && (
                            <button
                                onClick={() => setSelectedGroups([])}
                                className="text-sm text-primary-cyan hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    <HierarchicalView
                        key={refreshKey}
                        userRole={userRole}
                        userDepartment={userDepartment}
                        selectedGroups={selectedGroups.map(g => g.id)}
                        onGroupsSelect={handleGroupsSelect}
                        onStatsUpdate={setStats}
                    />
                </div>
            </div>

            {/* Transfer Modal */}
            <GroupTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                groups={selectedGroups}
                onTransferComplete={handleTransferComplete}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onGroupCreated={handleGroupCreated}
                preSelectedYear={selectedYearNumber}
            />
        </div>
    );
}
