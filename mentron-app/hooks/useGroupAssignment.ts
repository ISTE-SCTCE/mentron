'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Group Assignment Hook - Real-time synchronization
 * 
 * This hook provides:
 * - Real-time subscription to group assignment changes
 * - Automatic UI refresh when assignment changes
 * - Local storage cleanup on group changes
 * - Loading and error states
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

interface UseGroupAssignmentResult {
    assignment: StudentAssignment | null;
    isAssigned: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Local storage keys to clear on group change
const GROUP_STORAGE_KEYS = [
    'group_materials_cache',
    'group_preferences',
    'last_viewed_material',
];

export function useGroupAssignment(userId: string): UseGroupAssignmentResult {
    const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const previousGroupIdRef = useRef<string | null | undefined>(undefined);

    // Clear group-related local storage
    const clearGroupStorage = useCallback(() => {
        if (typeof window !== 'undefined') {
            GROUP_STORAGE_KEYS.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn(`Failed to clear ${key}:`, e);
                }
            });
            // Also clear any keys that start with 'group_'
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('group_')) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        console.warn(`Failed to clear ${key}:`, e);
                    }
                }
            });
            console.log('[GroupAssignment] Cleared group-related local storage');
        }
    }, []);

    // Fetch current assignment from server
    const fetchAssignment = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from('group_members')
                .select(`
                    id,
                    email,
                    name,
                    department,
                    year,
                    group_id,
                    group:groups(id, name, department, year, color)
                `)
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error('[GroupAssignment] Fetch error:', fetchError);
                setError('Failed to fetch group assignment');
                return;
            }

            // Transform the data
            // Supabase may return array for joins, get first element if so
            const groupData = Array.isArray(data.group) ? data.group[0] : data.group;
            const transformedData: StudentAssignment = {
                id: data.id,
                email: data.email,
                name: data.name,
                department: data.department,
                year: data.year,
                group_id: data.group_id,
                group: groupData as Group | null
            };

            // Check if group changed
            if (previousGroupIdRef.current !== undefined &&
                previousGroupIdRef.current !== data.group_id) {
                console.log('[GroupAssignment] Group changed from', previousGroupIdRef.current, 'to', data.group_id);
                clearGroupStorage();
            }

            previousGroupIdRef.current = data.group_id;
            setAssignment(transformedData);

        } catch (err) {
            console.error('[GroupAssignment] Unexpected error:', err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [userId, clearGroupStorage]);

    // Handle realtime updates
    const handleRealtimeUpdate = useCallback((payload: any) => {
        console.log('[GroupAssignment] Realtime update received:', payload);

        const newData = payload.new;
        const oldData = payload.old;

        // Check if this update is for our user
        if (newData?.id !== userId) {
            return;
        }

        // Detect group change
        const oldGroupId = oldData?.group_id;
        const newGroupId = newData?.group_id;

        if (oldGroupId !== newGroupId) {
            console.log('[GroupAssignment] Group assignment changed!');
            console.log('  Old group:', oldGroupId);
            console.log('  New group:', newGroupId);

            // Clear storage immediately
            clearGroupStorage();

            // Refetch to get full group details
            fetchAssignment();

            // Trigger a router refresh to update server components
            router.refresh();
        }
    }, [userId, clearGroupStorage, fetchAssignment, router]);

    // Setup realtime subscription
    useEffect(() => {
        const supabase = createClient();

        // Initial fetch
        fetchAssignment();

        // Create realtime channel
        const channel = supabase
            .channel(`group-assignment-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'group_members',
                    filter: `id=eq.${userId}`
                },
                handleRealtimeUpdate
            )
            .subscribe((status) => {
                console.log('[GroupAssignment] Subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('[GroupAssignment] Successfully subscribed to changes');
                }
            });

        channelRef.current = channel;

        // Cleanup on unmount
        return () => {
            console.log('[GroupAssignment] Cleaning up subscription');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [userId, fetchAssignment, handleRealtimeUpdate]);

    return {
        assignment,
        isAssigned: assignment?.group_id !== null,
        isLoading,
        error,
        refetch: fetchAssignment
    };
}
