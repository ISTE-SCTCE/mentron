'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { MaterialUploadForm } from '@/components/MaterialUploadForm';

export default function ChairmanUploadPage() {
    return (
        <DashboardLayout userRole="chairman">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Upload Material</h2>
                        <p className="text-text-secondary">
                            Share study materials with students
                        </p>
                    </div>

                    <MaterialUploadForm userRole="chairman" />

                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}

