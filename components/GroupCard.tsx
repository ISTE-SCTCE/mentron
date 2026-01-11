'use client';

import { useState, memo, useMemo, useCallback } from 'react';
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
    onDeleteStudent?: (student: Student) => void;
    onReassignStudent?: (student: Student) => void;
    isOver?: boolean;
}

export const GroupCard = memo(function GroupCard({ group, students, onDelete, onDeleteStudent, onReassignStudent, isOver }: GroupCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: { group }
    });

    // Memoize filtered students to prevent recalculation
    const groupStudents = useMemo(() =>
        students.filter(s => s.group_id === group.id || (group.id === 'unassigned' && !s.group_id)),
        [students, group.id]
    );

    // Memoize toggle handler
    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    return (
        <div
            ref={setNodeRef}
            className={`glass-card transition-all ${isOver ? 'ring-2 ring-primary-cyan scale-105' : ''
                }`}
        >
            {/* Group Header */}
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={toggleExpanded}
            >
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
                        <h3 className="font-semibold text-lg truncate">{group.name}</h3>
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
                    {!group.is_default && onDelete && (
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
                    <svg
                        className={`w-5 h-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Expanded Student List */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    {groupStudents.length > 0 ? (
                        groupStudents.map(student => (
                            <div
                                key={student.id}
                                className="group flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{
                                        background: `linear-gradient(135deg, ${group.color}, ${group.color}dd)`
                                    }}
                                >
                                    {(student.name || student.email)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{student.name || student.email}</div>
                                    <div className="text-xs text-text-secondary truncate">
                                        {[
                                            student.roll_number,
                                            `Year ${student.year}`,
                                            student.department
                                        ].filter(Boolean).join(' • ')}
                                    </div>
                                </div>

                                {/* Student Actions - visible on mobile, hover on desktop */}
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    {onReassignStudent && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReassignStudent(student);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-primary-cyan transition-all"
                                            title="Reassign Student"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDeleteStudent && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteStudent(student);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-all"
                                            title="Delete Student"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-text-secondary text-sm">
                            No students in this group yet. Drag students here to assign them.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
