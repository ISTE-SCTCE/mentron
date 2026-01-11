'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
    onDelete?: () => void;
    onReassign?: () => void;
    selectable?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    onClick?: () => void;
}

export const StudentCard = memo(function StudentCard({
    student,
    isDragging,
    onDelete,
    onReassign,
    selectable,
    isSelected,
    onToggleSelect,
    onClick
}: StudentCardProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.id,
        data: { student }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick} // Main card click opens detail view
            className={`
                group flex items-center gap-3 p-2 rounded-lg 
                ${isSelected ? 'bg-primary-cyan/20 ring-1 ring-primary-cyan' : 'bg-white/5 hover:bg-white/10'} 
                transition-all cursor-pointer
                ${isDragging ? 'opacity-50 scale-95' : ''}
            `}
        >
            {/* Checkbox for selection mode - visible on hover or when selected */}
            {selectable && (
                <div
                    className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 flex-shrink-0
                        ${isSelected
                            ? 'bg-primary-cyan border-primary-cyan text-white opacity-100'
                            : 'border-white/20 hover:border-primary-cyan/50 opacity-100'
                        }
                    `}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag/click
                        onToggleSelect?.();
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on checkbox
                >
                    {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            )}

            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                    background: student.group?.color
                        ? `linear-gradient(135deg, ${student.group.color}, ${student.group.color}dd)`
                        : 'linear-gradient(135deg, #06b6d4, #a855f7)'
                }}
            >
                {(student.name || student.email)[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-[var(--text-primary)]">
                    {student.name || student.email}
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                    {[
                        student.roll_number,
                        `Year ${student.year}`,
                        student.department
                    ].filter(Boolean).join(' • ')}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-100 transition-opacity">
                {!selectable && onReassign && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onReassign();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-primary-cyan/20 text-[var(--text-secondary)] hover:text-primary-cyan transition-colors"
                        title="Reassign Student"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                )}
                {!selectable && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        title="Delete Student"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
});
