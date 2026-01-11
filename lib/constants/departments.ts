/**
 * Official Department Structure
 * 
 * This file contains the standardized department list for the college.
 * All department references should use these constants to ensure consistency.
 * 
 * IMPORTANT: Any changes to department naming must be:
 * 1. Updated in this file
 * 2. Reflected in the database migration
 * 3. Approved by administration
 */

export interface Department {
    code: string;
    name: string;
    shortName: string;
    description: string;
    color: string;
}

/**
 * Official College Departments
 * Exact naming as per college standards
 */
export const DEPARTMENTS: Department[] = [
    {
        code: 'CS',
        name: 'Computer Science',
        shortName: 'CS',
        description: 'Department of Computer Science',
        color: '#3b82f6', // Blue
    },
    {
        code: 'CS-AIML',
        name: 'Computer Science (AI & ML)',
        shortName: 'CS (AI & ML)',
        description: 'Department of Computer Science specializing in Artificial Intelligence and Machine Learning',
        color: '#8b5cf6', // Purple
    },
    {
        code: 'ECE',
        name: 'Electronics and Communication',
        shortName: 'ECE',
        description: 'Department of Electronics and Communication',
        color: '#f59e0b', // Amber
    },
    {
        code: 'ME',
        name: 'Mechanical Engineering',
        shortName: 'ME',
        description: 'Department of Mechanical Engineering',
        color: '#ef4444', // Red
    },
    {
        code: 'AE',
        name: 'Automobile Engineering',
        shortName: 'AE',
        description: 'Department of Automobile Engineering',
        color: '#10b981', // Emerald
    },
    {
        code: 'BT',
        name: 'Biotechnology',
        shortName: 'BT',
        description: 'Department of Biotechnology',
        color: '#ec4899', // Pink
    },
];

/**
 * Get department codes for validation
 */
export const DEPARTMENT_CODES = DEPARTMENTS.map(d => d.code);

/**
 * Get department by code
 */
export function getDepartment(code: string): Department | undefined {
    return DEPARTMENTS.find(d => d.code === code);
}

/**
 * Get department name by code
 */
export function getDepartmentName(code: string): string {
    const dept = getDepartment(code);
    return dept?.name || code;
}

/**
 * Get department color by code
 */
export function getDepartmentColor(code: string): string {
    const dept = getDepartment(code);
    return dept?.color || '#6b7280';
}

/**
 * Validate if a department code is valid
 */
export function isValidDepartment(code: string): boolean {
    return DEPARTMENT_CODES.includes(code);
}

/**
 * Department options for select inputs
 */
export const DEPARTMENT_OPTIONS = DEPARTMENTS.map(d => ({
    value: d.code,
    label: `${d.code} - ${d.name}`,
    color: d.color,
}));

/**
 * Academic Year options
 */
export const ACADEMIC_YEARS = [
    { value: 1, label: 'First Year', name: '1st Year' },
    { value: 2, label: 'Second Year', name: '2nd Year' },
    { value: 3, label: 'Third Year', name: '3rd Year' },
    { value: 4, label: 'Fourth Year', name: '4th Year' },
];

export const YEAR_OPTIONS = ACADEMIC_YEARS.map(y => ({
    value: y.value,
    label: y.label,
}));
