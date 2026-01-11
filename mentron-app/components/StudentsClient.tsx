'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { GroupCard } from '@/components/GroupCard';
import { StudentCard } from '@/components/StudentCard';

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

interface StudentsClientProps {
    initialStudents: Student[];
    initialGroups: Group[];
    userDepartment: string;
    userRole: 'execom' | 'chairman';
}

export function StudentsClient({ initialStudents, initialGroups, userDepartment, userRole }: StudentsClientProps) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showYearView, setShowYearView] = useState(false);

    const unassignedStudents = students.filter(s => !s.group_id);
    const assignedStudents = students.filter(s => s.group_id);

    // Group students by year
    const studentsByYear = students.reduce((acc, student) => {
        if (!acc[student.year]) {
            acc[student.year] = [];
        }
        acc[student.year].push(student);
        return acc;
    }, {} as Record<number, Student[]>);

    // Filter students based on search
    const filteredUnassigned = unassignedStudents.filter(s =>
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragStart = (event: DragStartEvent) => {
        const student = event.active.data.current?.student;
        setActiveStudent(student || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveStudent(null);

        if (!over) return;

        const studentId = active.id as string;
        const targetGroupId = over.id === 'unassigned' ? null : (over.id as string);

        // Optimistic update
        setStudents(prev =>
            prev.map(s =>
                s.id === studentId ? { ...s, group_id: targetGroupId } : s
            )
        );

        try {
            const response = await fetch('/api/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: [studentId],
                    groupId: targetGroupId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to assign student');
            }

            // Refresh data
            await refreshData();
        } catch (error) {
            console.error('Error assigning student:', error);
            // Revert optimistic update
            setStudents(initialStudents);
            alert('Failed to assign student. Please try again.');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete group');
            }

            await refreshData();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Failed to delete group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteStudents = async (targetYear: number) => {
        if (selectedStudents.size === 0) {
            alert('Please select students to promote');
            return;
        }

        if (targetYear < 1 || targetYear > 4) {
            alert('Invalid target year');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/students/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: Array.from(selectedStudents),
                    targetYear
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to promote students');
            }

            setSelectedStudents(new Set());
            await refreshData();
            alert(`Successfully promoted ${selectedStudents.size} student(s) to Year ${targetYear}`);
        } catch (error: any) {
            console.error('Error promoting students:', error);
            alert(error.message || 'Failed to promote students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const selectAllInYear = (year: number) => {
        const yearStudents = studentsByYear[year] || [];
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            yearStudents.forEach(s => newSet.add(s.id));
            return newSet;
        });
    };

    const refreshData = async () => {
        try {
            const [studentsRes, groupsRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/groups')
            ]);

            const studentsData = await studentsRes.json();
            const groupsData = await groupsRes.json();

            setStudents(studentsData.students || []);
            setGroups(groupsData.groups || []);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete student');
            }

            await refreshData();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold">Student Management</h2>
                            <p className="text-text-secondary text-sm">
                                {students.length} total students • {groups.length} groups
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Group
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
                        <button
                            onClick={() => setShowYearView(false)}
                            className={`px-4 py-2 rounded-lg transition-all ${!showYearView
                                ? 'bg-gradient-to-r from-primary-cyan to-secondary-purple text-white'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Groups View
                        </button>
                        <button
                            onClick={() => setShowYearView(true)}
                            className={`px-4 py-2 rounded-lg transition-all ${showYearView
                                ? 'bg-gradient-to-r from-primary-cyan to-secondary-purple text-white'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Year Progression
                        </button>
                    </div>
                </div>

                {/* Search Bar - Only show in Groups View */}
                {!showYearView && (
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search students by email..."
                                className="w-full px-4 py-3 pl-11 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            />
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Year Progression View */}
                {showYearView ? (
                    <div className="space-y-6">
                        {/* Bulk Actions Bar */}
                        {selectedStudents.size > 0 && (
                            <div className="glass-card bg-primary-cyan/10 border-primary-cyan/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold">{selectedStudents.size} student(s) selected</p>
                                        <p className="text-sm text-text-secondary">Choose target year to promote</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(year => (
                                            <button
                                                key={year}
                                                onClick={() => handlePromoteStudents(year)}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-cyan to-secondary-purple hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                                            >
                                                → Year {year}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setSelectedStudents(new Set())}
                                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Students Grouped by Year */}
                        {[1, 2, 3, 4].map(year => {
                            const yearStudents = studentsByYear[year] || [];
                            const selectedInYear = yearStudents.filter(s => selectedStudents.has(s.id)).length;

                            return (
                                <div key={year} className="glass-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${['#06b6d4', '#a855f7', '#ec4899', '#10b981'][year - 1]}, ${['#06b6d4dd', '#a855f7dd', '#ec4899dd', '#10b981dd'][year - 1]})`
                                                }}
                                            >
                                                {year}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Year {year}</h3>
                                                <p className="text-text-secondary text-sm">
                                                    {yearStudents.length} student{yearStudents.length !== 1 ? 's' : ''}
                                                    {selectedInYear > 0 && ` • ${selectedInYear} selected`}
                                                </p>
                                            </div>
                                        </div>
                                        {yearStudents.length > 0 && (
                                            <button
                                                onClick={() => selectAllInYear(year)}
                                                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                                            >
                                                Select All
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {yearStudents.length > 0 ? (
                                            yearStudents.map(student => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => toggleStudentSelection(student.id)}
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedStudents.has(student.id)
                                                        ? 'bg-primary-cyan/20 border border-primary-cyan/40'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                                            style={{
                                                                background: student.group?.color
                                                                    ? `linear-gradient(135deg, ${student.group.color}, ${student.group.color}dd)`
                                                                    : `linear-gradient(135deg, ${['#06b6d4', '#a855f7', '#ec4899', '#10b981'][year - 1]}, ${['#06b6d4dd', '#a855f7dd', '#ec4899dd', '#10b981dd'][year - 1]})`
                                                            }}
                                                        >
                                                            {(student.name || student.email)[0].toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-semibold text-sm truncate">{student.name || student.email}</div>
                                                            <div className="text-text-secondary text-xs truncate">
                                                                {[
                                                                    student.roll_number,
                                                                    student.department,
                                                                    student.group?.name
                                                                ].filter(Boolean).join(' • ')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedStudents.has(student.id) && (
                                                        <svg className="w-5 h-5 text-primary-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-text-secondary text-sm">
                                                No students in Year {year}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        {/* Groups View - Existing Content */}
                        {/* Unassigned Students Section */}
                        <div className="mb-8">
                            <div className="glass-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Unassigned Students</h3>
                                            <p className="text-text-secondary text-sm">
                                                {filteredUnassigned.length} student{filteredUnassigned.length !== 1 ? 's' : ''} without a group
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredUnassigned.length > 0 ? (
                                        filteredUnassigned.map(student => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                onDelete={() => handleDeleteStudent(student.id)}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-text-secondary">
                                            {searchQuery ? 'No matching students found' : 'All students are assigned to groups'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Groups Grid */}
                        <div>
                            <h3 className="text-xl font-semibold mb-4">
                                Groups ({groups.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map(group => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        students={assignedStudents}
                                        onDelete={handleDeleteGroup}
                                        onDeleteStudent={(student) => handleDeleteStudent(student.id)}
                                    />
                                ))}
                            </div>

                            {groups.length === 0 && (
                                <div className="glass-card text-center py-16">
                                    <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
                                    <p className="text-text-secondary mb-4">
                                        Create your first group to start organizing students
                                    </p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="btn btn-primary"
                                    >
                                        Create Group
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DndContext>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeStudent ? (
                    <div className="opacity-80">
                        <StudentCard student={activeStudent} />
                    </div>
                ) : null}
            </DragOverlay>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refreshData}
                userDepartment={userDepartment}
                userRole={userRole}
            />
        </>
    );
}
