'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StudentDetailModal } from './StudentDetailModal';

interface Student {
    id: string;
    email: string;
    name?: string | null;
    roll_number?: string | null;
    department: string;
    year: number;
    created_at: string;
    group_id: string | null;
    // StudentDetailModal expects group? object nested?
    // The main 'Student' interface in StudentDetailModal expects specific shape.
    // The 'Student' here comes from DB.
    // I need to ensure it matches or fetch full details inside modal (Modal does fetch).
    // The props for Modal just need 'studentId'.
    // The interface here is for the LIST view.
}

interface Group {
    id: string;
    name: string;
    department: string;
    year: number | null;
    description: string | null;
    color: string;
}

interface GroupDetailViewProps {
    group: Group;
    students: Student[];
    userRole: string;
}

export function GroupDetailView({ group, students, userRole }: GroupDetailViewProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span
                                className="w-4 h-4 rounded-full inline-block"
                                style={{ backgroundColor: group.color }}
                            ></span>
                            {group.name}
                        </h1>
                        <p className="text-text-secondary">
                            {group.department} • {group.year ? `Year ${group.year}` : 'All Years'} • {students.length} Students
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none transition-all"
                    />
                </div>

                {/* Student List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform"
                                style={{
                                    background: `linear-gradient(135deg, ${group.color}, ${group.color}dd)`
                                }}
                            >
                                {(student.name || student.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold truncate text-[var(--text-primary)] group-hover:text-primary-cyan transition-colors">
                                    {student.name || 'Unnamed Student'}
                                </h3>
                                <p className="text-sm text-text-secondary truncate">{student.email}</p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    {student.roll_number || 'No Roll No'} • {student.department}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 text-center text-text-secondary">
                            {searchTerm ? 'No students found matching your search.' : 'No students in this group.'}
                        </div>
                    )}
                </div>

                <div className="h-8 sm:h-0 mobile-nav-safe"></div>
            </div>

            {/* Student Detail Modal */}
            <StudentDetailModal
                isOpen={!!selectedStudentId}
                onClose={() => setSelectedStudentId(null)}
                studentId={selectedStudentId}
                userRole={userRole as 'chairman' | 'execom'}
            // Optional: Pass handlers if we want Reassign/Delete from here
            // For now, View Only is safe and meets "redirect" requirement
            />
        </main>
    );
}
