'use client';

import { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';

interface Student {
    id: string;
    email: string;
    name?: string | null;
    roll_number?: string | null;
    department: string;
    year: number;
    group?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

interface StudentCardProps {
    student: Student;
    isDragging?: boolean;
}

// Default gradient for students without group
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #06b6d4, #a855f7)';

export const StudentCard = memo(function StudentCard({ student, isDragging, onDelete }: StudentCardProps & { onDelete?: () => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.id,
        data: { student }
    });

    // Memoize computed values
    const { displayName, displaySubtitle, avatarStyle, groupColor } = useMemo(() => {
        const name = student.name || student.email;
        const subtitle = [
            student.roll_number,
            `Year ${student.year}`,
            student.department
        ].filter(Boolean).join(' • ');

        const color = student.group?.color;
        const avatar = color
            ? { background: `linear-gradient(135deg, ${color}, ${color}dd)` }
            : { background: DEFAULT_GRADIENT };

        return {
            displayName: name,
            displaySubtitle: subtitle,
            avatarStyle: avatar,
            groupColor: color
        };
    }, [student.name, student.email, student.roll_number, student.year, student.department, student.group?.color]);

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : ''}`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={avatarStyle}
                >
                    {displayName[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{displayName}</div>
                    <div className="text-text-secondary text-xs truncate">
                        {displaySubtitle}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {student.group && groupColor && (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{
                            backgroundColor: `${groupColor}20`,
                            color: groupColor,
                            borderColor: `${groupColor}40`,
                            borderWidth: '1px'
                        }}
                    >
                        {student.group.name}
                    </span>
                )}
                {onDelete ? (
                    <button
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors z-10"
                        title="Delete Student"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                ) : (
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </div>
        </div>
    );
});

