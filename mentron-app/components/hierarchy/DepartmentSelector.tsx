'use client';

import { DEPARTMENTS } from '@/lib/constants';

interface Department {
    id: string;
    code: string;
    name: string;
    description?: string;
    color: string;
    is_active: boolean;
}

interface DepartmentSelectorProps {
    selectedDeptId: string | null;
    onDepartmentChange: (deptId: string | null, deptCode: string | null) => void;
    yearId?: string | null;
    showAll?: boolean;
    className?: string;
}

export function DepartmentSelector({
    selectedDeptId,
    onDepartmentChange,
    showAll = true,
    className = ''
}: DepartmentSelectorProps) {
    // Use constants directly instead of API
    const departments: Department[] = DEPARTMENTS.map(d => ({
        id: d.code,
        code: d.code,
        name: d.name,
        description: d.description,
        color: d.color,
        is_active: true
    }));

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {showAll && (
                <button
                    onClick={() => onDepartmentChange(null, null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDeptId === null
                            ? 'bg-secondary-purple text-white shadow-lg shadow-secondary-purple/25'
                            : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                        }`}
                >
                    All Departments
                </button>
            )}
            {departments.map((dept) => (
                <button
                    key={dept.id}
                    onClick={() => onDepartmentChange(dept.id, dept.code)}
                    disabled={!dept.is_active}
                    style={{
                        '--dept-color': dept.color
                    } as React.CSSProperties}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDeptId === dept.id
                            ? 'text-white shadow-lg'
                            : dept.is_active
                                ? 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
                                : 'bg-white/5 text-[var(--text-secondary)]/50 cursor-not-allowed'
                        }`}
                    {...(selectedDeptId === dept.id && {
                        style: { backgroundColor: dept.color, '--dept-color': dept.color } as React.CSSProperties
                    })}
                >
                    <span>{dept.code}</span>
                </button>
            ))}
        </div>
    );
}
