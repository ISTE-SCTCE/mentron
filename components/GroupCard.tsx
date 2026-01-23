'use client';

import { useRouter } from 'next/navigation';
import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';

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

interface Student {
    id: string;
    email: string;
    name?: string | null;
    roll_number?: string | null;
    department: string;
    year: number;
    group_id: string | null;
}

interface GroupCardProps {
    group: Group;
    students: Student[];
    onDelete?: (groupId: string) => void;
    onEdit?: (group: Group) => void;
    onDeleteStudent?: (student: Student) => void;
    onReassignStudent?: (student: Student) => void;
    isOver?: boolean;
    selectable?: boolean;
    selectedStudentIds?: string[];
    onToggleSelect?: (studentId: string) => void;
    onSelectAll?: (groupId: string) => void;
    onStudentClick?: (student: Student) => void;
}

export const GroupCard = memo(function GroupCard({
    group,
    students,
    onDelete,
    onDeleteStudent,
    onReassignStudent,
    isOver,
    selectable,
    selectedStudentIds,
    onToggleSelect,
    onSelectAll,
    onStudentClick,
    onEdit
}: GroupCardProps) {
    const router = useRouter();
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: { group }
    });

    const groupStudents = useMemo(() =>
        students.filter(s => s.group_id === group.id || (group.id === 'unassigned' && !s.group_id)),
        [students, group.id]
    );

    const handleCardClick = () => {
        router.push(`/groups/${group.id}`);
    };

    return (
        <div
            ref={setNodeRef}
            onClick={handleCardClick}
            className={`glass-card cursor-pointer relative overflow-hidden group ${isOver ? 'ring-2 ring-primary-cyan scale-105' : ''}`}
        >
            {/* Gloss Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Group Header */}
            <div className="flex items-center justify-between p-2 rounded-lg -m-2 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${group.color}20` }}
                    >
                        <svg
                            className="w-6 h-6"
                            style={{ color: group.color }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate pt-1">{group.name}</h3>
                        <p className="text-text-secondary text-sm">
                            {group.department} {group.year ? `• Year ${group.year}` : '• All Years'}
                        </p>
                        {group.description && (
                            <p className="text-text-secondary text-xs mt-1 truncate">
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{
                            backgroundColor: `${group.color}20`,
                            color: group.color
                        }}
                    >
                        {groupStudents.length}
                    </span>

                    {/* Actions - Prevent bubbling to prevent navigation when clicking actions */}
                    {!group.is_default && (
                        <>
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(group);
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-primary-cyan transition-colors"
                                    title="Edit group"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete group "${group.name}"? Students will be unassigned.`)) {
                                            onDelete(group.id);
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="Delete group"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}

                    <svg
                        className="w-5 h-5 text-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
});
