'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGroupAssignmentContext, type Group, type StudentAssignment } from '@/components/GroupAssignmentProvider';
import { UnassignedStudentBanner } from '@/components/UnassignedStudentBanner';
import { MaterialViewButton } from '@/components/MaterialViewButton';
import { StatCard } from '@/components/StatCard';
import { createClient } from '@/lib/supabase/client';

/**
 * StudentDashboardClient - Real-time student dashboard
 * 
 * This client component:
 * - Uses GroupAssignmentContext for real-time group updates
 * - Fetches materials based on current group assignment
 * - Automatically updates when group changes
 * - Shows appropriate UI for assigned/unassigned states
 */

interface Material {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string;
    department: string;
    year: string | null;
    view_count: number;
    created_at: string;
}

interface StudentDashboardClientProps {
    initialMaterials: Material[];
}

export function StudentDashboardClient({ initialMaterials }: StudentDashboardClientProps) {
    const { assignment, isAssigned, isLoading, error, refetch } = useGroupAssignmentContext();
    const [materials, setMaterials] = useState<Material[]>(initialMaterials);
    const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);

    const studentGroup = assignment?.group;
    const userName = assignment?.email?.split('@')[0] || 'Student';

    // Fetch materials for current group
    const fetchMaterials = useCallback(async () => {
        if (!isAssigned || !studentGroup) {
            setMaterials([]);
            return;
        }

        setIsFetchingMaterials(true);
        try {
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from('materials')
                .select('*')
                .eq('department', studentGroup.department)
                .or(`year.eq.${studentGroup.year},year.is.null`)
                .order('created_at', { ascending: false });

            if (fetchError) {
                console.error('[Dashboard] Materials fetch error:', fetchError);
                return;
            }

            console.log('[Dashboard] Fetched materials for group:', studentGroup.name, data?.length || 0);
            setMaterials(data || []);
        } catch (err) {
            console.error('[Dashboard] Unexpected error fetching materials:', err);
        } finally {
            setIsFetchingMaterials(false);
        }
    }, [isAssigned, studentGroup]);

    // Refetch materials when group changes
    useEffect(() => {
        if (isAssigned && studentGroup) {
            fetchMaterials();
        } else {
            // Clear materials when unassigned
            setMaterials([]);
        }
    }, [isAssigned, studentGroup?.id, fetchMaterials]);

    // Calculate real chart data based on materials created_at
    const calculateMaterialsChartData = useCallback(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        materials.forEach(material => {
            const itemDate = new Date(material.created_at);
            const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
            const diffTime = today.getTime() - itemDay.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                counts[6 - diffDays]++;
            }
        });

        return counts;
    }, [materials]);

    // Calculate new materials this week
    const calculateNewThisWeek = useCallback(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return materials.filter(m => new Date(m.created_at) > weekAgo).length;
    }, [materials]);

    // Calculate total views from materials
    const calculateTotalViews = useCallback(() => {
        return materials.reduce((sum, m) => sum + (m.view_count || 0), 0);
    }, [materials]);

    const weeklyChartData = calculateMaterialsChartData();
    const newThisWeek = calculateNewThisWeek();
    const totalViews = calculateTotalViews();


    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-primary-cyan mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[var(--text-secondary)]">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="glass-card text-center py-12">
                <svg className="w-16 h-16 text-accent-pink mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
                <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                <button
                    onClick={() => refetch()}
                    className="btn btn-primary"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Unassigned state
    if (!isAssigned) {
        return (
            <UnassignedStudentBanner
                studentName={assignment?.name || userName}
                department={assignment?.department}
            />
        );
    }

    // Assigned state - show full dashboard
    return (
        <>
            {/* Group Badge */}
            {studentGroup && (
                <div className="mb-6 flex items-center gap-3">
                    <span
                        className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                        style={{
                            backgroundColor: `${studentGroup.color}20`,
                            color: studentGroup.color,
                            border: `1px solid ${studentGroup.color}40`
                        }}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: studentGroup.color }}></span>
                        {studentGroup.name}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                        {studentGroup.department} • Year {studentGroup.year}
                    </span>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10">
                <StatCard
                    title="Available Materials"
                    value={materials.length}
                    trend={{
                        percentage: newThisWeek > 0 ? Math.round((newThisWeek / Math.max(materials.length, 1)) * 100) : 0,
                        direction: newThisWeek > 0 ? 'up' : 'neutral'
                    }}
                    subtitle={`For ${studentGroup?.department || 'your group'}`}
                    chartData={weeklyChartData}
                    color="blue"
                    icon={
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Total Views"
                    value={totalViews}
                    trend={{
                        percentage: totalViews > 0 ? 12 : 0,
                        direction: totalViews > 0 ? 'up' : 'neutral'
                    }}
                    subtitle="All materials"
                    chartData={weeklyChartData}
                    color="purple"
                    icon={
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    }
                />

                <StatCard
                    title="New This Week"
                    value={newThisWeek}
                    trend={{
                        percentage: newThisWeek > 0 ? 100 : 0,
                        direction: newThisWeek > 0 ? 'up' : 'neutral'
                    }}
                    subtitle="Recently added"
                    chartData={weeklyChartData}
                    color="cyan"
                    icon={
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    }
                />
            </div>

            {/* Materials Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold">Study Materials</h2>
                    {isFetchingMaterials && (
                        <svg className="animate-spin w-5 h-5 text-primary-cyan" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    )}
                </div>
            </div>

            {materials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {materials.map((material) => (
                        <div
                            key={material.id}
                            className="glass-card hover:scale-[1.02] transition-transform touch-manipulation"
                        >
                            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-cyan/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-semibold mb-1 truncate">{material.title}</h3>
                                    {material.description && (
                                        <p className="text-text-secondary text-xs sm:text-sm line-clamp-2">
                                            {material.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-secondary mb-4">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {material.view_count} views
                                </span>
                                <span className="uppercase font-semibold">{material.file_type}</span>
                            </div>
                            <MaterialViewButton
                                materialId={material.id}
                                fileUrl={material.file_url}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card text-center py-12 sm:py-16">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">No Materials Yet</h3>
                    <p className="text-text-secondary text-sm sm:text-base">
                        Study materials for {studentGroup?.department} Year {studentGroup?.year} will appear here.
                    </p>
                </div>
            )}
        </>
    );
}
