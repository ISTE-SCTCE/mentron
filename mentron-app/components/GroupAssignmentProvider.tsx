'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGroupAssignment } from '@/hooks/useGroupAssignment';

/**
 * Group Assignment Context Provider
 * 
 * Provides group assignment state to all child components.
 * Use this to wrap the student dashboard for consistent state access.
 */

interface Group {
    id: string;
    name: string;
    department: string;
    year: number;
    color: string;
}

interface StudentAssignment {
    id: string;
    email: string;
    name: string | null;
    department: string;
    year: number;
    group_id: string | null;
    group: Group | null;
}

interface GroupAssignmentContextValue {
    assignment: StudentAssignment | null;
    isAssigned: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const GroupAssignmentContext = createContext<GroupAssignmentContextValue | null>(null);

interface GroupAssignmentProviderProps {
    userId: string;
    children: ReactNode;
}

export function GroupAssignmentProvider({ userId, children }: GroupAssignmentProviderProps) {
    const groupAssignment = useGroupAssignment(userId);

    return (
        <GroupAssignmentContext.Provider value={groupAssignment}>
            {children}
        </GroupAssignmentContext.Provider>
    );
}

export function useGroupAssignmentContext(): GroupAssignmentContextValue {
    const context = useContext(GroupAssignmentContext);

    if (!context) {
        throw new Error('useGroupAssignmentContext must be used within a GroupAssignmentProvider');
    }

    return context;
}

// Export types for use in other components
export type { Group, StudentAssignment, GroupAssignmentContextValue };
