'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AnalyticsData {
    totalMaterials: number;
    totalViews: number;
    totalStudents: number;
    newThisWeek: number;
    weeklyMaterialsCounts: number[];
    weeklyViewsCounts: number[];
}

interface UseRealTimeAnalyticsOptions {
    department?: string;
    enabled?: boolean;
}

/**
 * Hook for real-time analytics with Supabase Realtime subscriptions
 * Automatically updates when materials or view counts change
 */
export function useRealTimeAnalytics(options: UseRealTimeAnalyticsOptions = {}) {
    const { department, enabled = true } = options;
    const [data, setData] = useState<AnalyticsData>({
        totalMaterials: 0,
        totalViews: 0,
        totalStudents: 0,
        newThisWeek: 0,
        weeklyMaterialsCounts: [0, 0, 0, 0, 0, 0, 0],
        weeklyViewsCounts: [0, 0, 0, 0, 0, 0, 0],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Calculate weekly data from materials
    const calculateWeeklyData = useCallback((materials: { created_at: string; view_count: number }[]) => {
        const materialCounts = [0, 0, 0, 0, 0, 0, 0];
        const viewCounts = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let newThisWeek = 0;

        materials.forEach(material => {
            if (!material.created_at) return;

            try {
                const itemDate = new Date(material.created_at);
                if (isNaN(itemDate.getTime())) return;

                const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
                const diffTime = today.getTime() - itemDay.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays < 7) {
                    materialCounts[6 - diffDays]++;
                    viewCounts[6 - diffDays] += (material.view_count || 0);
                    newThisWeek++;
                }
            } catch {
                // Skip invalid entries
            }
        });

        return { materialCounts, viewCounts, newThisWeek };
    }, []);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Build query
            let materialsQuery = supabase
                .from('materials')
                .select('id, created_at, view_count');

            if (department) {
                materialsQuery = materialsQuery.eq('department', department);
            }

            const [materialsResult, studentsResult] = await Promise.all([
                materialsQuery,
                supabase.from('group_members').select('id', { count: 'exact' })
            ]);

            if (materialsResult.error) throw materialsResult.error;

            const materials = materialsResult.data || [];
            const totalViews = materials.reduce((sum, m) => sum + (m.view_count || 0), 0);
            const { materialCounts, viewCounts, newThisWeek } = calculateWeeklyData(materials);

            setData({
                totalMaterials: materials.length,
                totalViews,
                totalStudents: studentsResult.count || 0,
                newThisWeek,
                weeklyMaterialsCounts: materialCounts,
                weeklyViewsCounts: viewCounts,
            });

            setLastUpdated(new Date());
        } catch (err: any) {
            console.error('[Analytics] Fetch error:', err);
            setError(err.message || 'Failed to fetch analytics data');
        } finally {
            setIsLoading(false);
        }
    }, [enabled, department, calculateWeeklyData]);

    // Set up real-time subscription
    useEffect(() => {
        if (!enabled) return;

        fetchData();

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        // Subscribe to materials table changes
        channel = supabase
            .channel('analytics-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'materials'
                },
                (payload) => {
                    console.log('[Analytics] Real-time update received:', payload.eventType);
                    // Refetch data on any change
                    fetchData();
                }
            )
            .subscribe((status) => {
                console.log('[Analytics] Subscription status:', status);
            });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [enabled, fetchData]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        isLoading,
        error,
        lastUpdated,
        refresh,
    };
}
