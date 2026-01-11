'use client';

import { useState } from 'react';
import {
    UnassignedStudentsList,
    StudentAssignmentModal,
    BulkReassignmentModal,
    AssignmentHistory
} from '@/components/assignment';

interface AssignmentsClientProps {
    userRole: 'chairman' | 'execom';
    userDepartment?: string;
}

export function AssignmentsClient({ userRole, userDepartment }: AssignmentsClientProps) {
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState<'unassigned' | 'history'>('unassigned');
    const [manualAssignmentId, setManualAssignmentId] = useState<string | null>(null);

    function handleAssignmentComplete() {
        setSelectedStudentIds([]);
        setRefreshKey(prev => prev + 1);
    }

    function handleReassignmentComplete() {
        setSelectedStudentIds([]);
        setShowReassignModal(false);
        setRefreshKey(prev => prev + 1);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                        Student Assignments
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Assign unassigned students to groups
                    </p>
                </div>

                {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Assign {selectedStudentIds.length}
                        </button>
                        <button
                            onClick={() => setShowReassignModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary-purple hover:bg-secondary-purple/80 text-white rounded-lg font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            Reassign All Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">--</p>
                            <p className="text-xs text-[var(--text-secondary)]">Pending Assignment</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-cyan/10 to-transparent border border-primary-cyan/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-cyan/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{selectedStudentIds.length}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Selected</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary-purple/10 to-transparent border border-secondary-purple/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary-purple/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-secondary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">--</p>
                            <p className="text-xs text-[var(--text-secondary)]">Today&apos;s Assignments</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('unassigned')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'unassigned'
                        ? 'bg-primary-cyan text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                >
                    Unassigned Students
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-primary-cyan text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                >
                    Assignment History
                </button>
            </div>

            {/* Content */}
            <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-6">
                    {activeTab === 'unassigned' ? (
                        <UnassignedStudentsList
                            key={refreshKey}
                            selectedStudentIds={selectedStudentIds}
                            onStudentsSelect={setSelectedStudentIds}
                            userDepartment={userDepartment}
                            onAssignSingle={(id) => {
                                setManualAssignmentId(id);
                                setShowAssignModal(true);
                            }}
                        />
                    ) : (
                        <AssignmentHistory key={refreshKey} />
                    )}
                </div>
            </div>

            {/* Assignment Modal (for new assignments) */}
            <StudentAssignmentModal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false);
                    setManualAssignmentId(null);
                }}
                selectedStudentIds={manualAssignmentId ? [manualAssignmentId] : selectedStudentIds}
                onAssignmentComplete={handleAssignmentComplete}
            />

            {/* Bulk Reassignment Modal */}
            <BulkReassignmentModal
                isOpen={showReassignModal}
                onClose={() => setShowReassignModal(false)}
                selectedStudentIds={selectedStudentIds}
                onReassignmentComplete={handleReassignmentComplete}
            />
        </div>
    );
}

