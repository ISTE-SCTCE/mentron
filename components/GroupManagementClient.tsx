'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { GroupCard } from '@/components/GroupCard';
import { StudentCard } from '@/components/StudentCard';
import { StudentReassignmentModal } from '@/components/StudentReassignmentModal';
import { DeleteStudentModal } from '@/components/DeleteStudentModal';
import { StudentDetailModal } from '@/components/StudentDetailModal';
import { BulkReassignmentModal } from '@/components/assignment/BulkReassignmentModal';
import { AssignmentsClient } from '@/components/assignment';
import { HierarchicalView } from '@/components/hierarchy/HierarchicalView';
import { useToast } from '@/lib/context/ToastContext';


interface Student {
    id: string;
    email: string;
    name?: string | null;
    roll_number?: string | null;
    department: string;
    year: number;
    group_id: string | null;
    group?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    description: string | null;
    color: string;
    is_default: boolean;
    member_count: number;
}

interface HierarchyStats {
    years: number;
    departments: number;
    groups: number;
    students: number;
}

interface GroupManagementClientProps {
    initialStudents: Student[];
    initialGroups: Group[];
    userDepartment: string;
    userRole: 'execom' | 'chairman';
}

type TabType = 'groups' | 'students' | 'hierarchy';

export function GroupManagementClient({
    initialStudents,
    initialGroups,
    userDepartment,
    userRole
}: GroupManagementClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get initial tab from URL or default to 'groups'
    const initialTab = (searchParams.get('tab') as TabType) || 'groups';

    // Handle Deep Linking for Student Details
    useEffect(() => {
        const deepLinkStudentId = searchParams.get('studentId');
        if (deepLinkStudentId) {
            setDetailStudentId(deepLinkStudentId);
            setShowDetailModal(true);
        }
    }, [searchParams]);

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [reassignStudent, setReassignStudent] = useState<Student | null>(null);
    const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
    const [hierarchyStats, setHierarchyStats] = useState<HierarchyStats | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Configure sensors for better mobile interaction (allow scrolling, prevent accidental drags)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Multi-select state for bulk operations
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

    // Student detail modal state
    const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Update URL when tab changes
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const handleDragStart = (event: DragStartEvent) => {
        const student = students.find(s => s.id === event.active.id);
        setActiveStudent(student || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveStudent(null);
        const { active, over } = event;

        if (!over) return;

        const studentId = active.id as string;
        const groupId = over.id as string;

        const student = students.find(s => s.id === studentId);
        if (!student || student.group_id === groupId) return;

        try {
            const res = await fetch('/api/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: [studentId],
                    groupId: groupId === 'unassigned' ? null : groupId
                })
            });

            if (res.ok) {
                refreshData();
            }
        } catch (error) {
            console.error('Failed to assign student:', error);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
            if (res.ok) {
                refreshData();
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const handleReassignClick = (student: Student) => {
        setReassignStudent(student);
    };

    const handleStudentClick = (student: Student) => {
        setDetailStudentId(student.id);
        setShowDetailModal(true);
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAllInGroup = (groupId: string) => {
        const groupStudents = studentsByGroup[groupId] || [];
        const groupStudentIds = groupStudents.map(s => s.id);
        const allSelected = groupStudentIds.every(id => selectedStudentIds.includes(id));

        if (allSelected) {
            // Deselect all from this group
            setSelectedStudentIds(prev => prev.filter(id => !groupStudentIds.includes(id)));
        } else {
            // Select all from this group
            setSelectedStudentIds(prev => {
                const newIds = groupStudentIds.filter(id => !prev.includes(id));
                return [...prev, ...newIds];
            });
        }
    };

    const handleBulkAssignComplete = () => {
        setSelectedStudentIds([]);
        setShowBulkAssignModal(false);
        refreshData();
    };

    const handleDetailAction = (action: 'reassign' | 'delete', student: Student) => {
        if (action === 'reassign') {
            setReassignStudent(student);
        } else {
            setDeleteStudent(student);
        }
    };

    const refreshData = useCallback(async () => {
        try {
            const [studentsRes, groupsRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/groups')
            ]);

            if (studentsRes.ok) {
                const data = await studentsRes.json();
                setStudents(data.students || []);
            }
            if (groupsRes.ok) {
                const data = await groupsRes.json();
                setGroups(data.groups || []);
            }
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }, []);

    // Group students by group
    const studentsByGroup = students.reduce((acc, student) => {
        const groupId = student.group_id || 'unassigned';
        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    const tabs = [
        {
            id: 'groups' as TabType, label: 'Groups', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            id: 'students' as TabType, label: 'Student Assignment', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            )
        },
        {
            id: 'hierarchy' as TabType, label: 'Hierarchy', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                        Group Management
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {activeTab === 'groups' && 'Manage groups and drag students to assign'}
                        {activeTab === 'students' && 'Assign students to groups'}
                        {activeTab === 'hierarchy' && 'View organizational structure'}
                    </p>
                </div>

                {activeTab === 'groups' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Group
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit border border-[var(--glass-border)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-primary-cyan text-white shadow-lg'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Bulk Action Toolbar */}
            {activeTab === 'groups' && selectedStudentIds.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-primary-cyan fixed bottom-6 left-4 right-4 z-50 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-cyan/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">
                                    {selectedStudentIds.length} Student{selectedStudentIds.length > 1 ? 's' : ''} Selected
                                </p>
                                <p className="text-sm text-text-secondary">Choose an action below</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowBulkAssignModal(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Assign to Group
                            </button>
                            <button
                                onClick={() => setSelectedStudentIds([])}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-lg font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Bar for Hierarchy */}
            {activeTab === 'hierarchy' && hierarchyStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Years', value: hierarchyStats.years, color: 'primary-cyan' },
                        { label: 'Departments', value: hierarchyStats.departments, color: 'secondary-purple' },
                        { label: 'Groups', value: hierarchyStats.groups, color: 'accent-pink' },
                        { label: 'Students', value: hierarchyStats.students, color: 'yellow-500' }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className={`p-3 rounded-lg bg-${stat.color}/10 border border-${stat.color}/20`}
                        >
                            <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'groups' && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {/* Unassigned Students Card */}
                            <GroupCard
                                group={{
                                    id: 'unassigned',
                                    name: 'Unassigned Students',
                                    department: 'All',
                                    year: null,
                                    description: 'Students not assigned to any group',
                                    color: '#FFA500',
                                    is_default: false,
                                    member_count: studentsByGroup['unassigned']?.length || 0
                                }}
                                students={studentsByGroup['unassigned'] || []}
                                onReassignStudent={handleReassignClick}
                                onDeleteStudent={setDeleteStudent}
                                selectable={true}
                                selectedStudentIds={selectedStudentIds}
                                onToggleSelect={toggleStudentSelection}
                                onSelectAll={handleSelectAllInGroup}
                                onStudentClick={handleStudentClick}
                            />

                            {/* Group Cards */}
                            {groups.map(group => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    students={studentsByGroup[group.id] || []}
                                    onDelete={() => handleDeleteGroup(group.id)}
                                    onEdit={(group) => {
                                        setEditingGroup(group);
                                        setShowCreateModal(true);
                                    }}
                                    onReassignStudent={handleReassignClick}
                                    onDeleteStudent={setDeleteStudent}
                                    selectable={true}
                                    selectedStudentIds={selectedStudentIds}
                                    onToggleSelect={toggleStudentSelection}
                                    onSelectAll={handleSelectAllInGroup}
                                    onStudentClick={handleStudentClick}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeStudent && (
                                <StudentCard
                                    student={activeStudent}
                                    isDragging
                                />
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                {activeTab === 'students' && (
                    <AssignmentsClient
                        key={refreshKey}
                        userRole={userRole}
                        userDepartment={userDepartment}
                    />
                )}

                {activeTab === 'hierarchy' && (
                    <div className="rounded-xl border border-[var(--glass-border)] p-4 md:p-6">
                        <HierarchicalView
                            key={refreshKey}
                            userRole={userRole}
                            userDepartment={userDepartment}
                            onStatsUpdate={setHierarchyStats}
                        />
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingGroup(null);
                }}
                onSuccess={refreshData}
                userDepartment={userDepartment}
                userRole={userRole}
                initialData={editingGroup}

            />

            {/* Reassignment Modal */}
            <StudentReassignmentModal
                isOpen={!!reassignStudent}
                onClose={() => setReassignStudent(null)}
                student={reassignStudent}
                currentGroupId={reassignStudent?.group_id || null}
                groups={groups}
                onSuccess={refreshData}
            />

            {/* Delete Student Modal */}
            <DeleteStudentModal
                isOpen={!!deleteStudent}
                onClose={() => setDeleteStudent(null)}
                onSuccess={refreshData}
                student={deleteStudent}
            />

            {/* Student Detail Modal */}
            <StudentDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                studentId={detailStudentId}
                onReassign={(student) => handleDetailAction('reassign', student)}
                onDelete={(student) => handleDetailAction('delete', student)}
                userRole={userRole}
            />

            {/* Bulk Reassignment Modal */}
            <BulkReassignmentModal
                isOpen={showBulkAssignModal}
                onClose={() => setShowBulkAssignModal(false)}
                selectedStudentIds={selectedStudentIds}
                onReassignmentComplete={handleBulkAssignComplete}
            />
        </div>
    );
}
