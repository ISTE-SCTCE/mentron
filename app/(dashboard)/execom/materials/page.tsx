import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardLayout } from '@/components/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function ExecomMaterialsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get execom profile
    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin) {
        redirect('/login');
    }

    // Get all materials
    const { data: materials } = await supabase
        .from('materials')
        .select(`
            *,
            group:groups(name)
        `)
        .order('created_at', { ascending: false });

    const userName = admin.position || admin.email.split('@')[0];

    const handleSignOut = async () => {
        'use server';
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    };

    return (
        <DashboardLayout userRole="execom">
            <main className="relative min-h-screen p-6 sm:p-8 lg:p-10">
                <div className="max-w-7xl mx-auto">
                    <DashboardHeader
                        userName={userName}
                        subtitle={`${admin.department} - Execom Member`}
                        userRole="execom"
                        onSignOut={handleSignOut}
                    />

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="!text-3xl sm:!text-4xl font-bold mb-2">Materials Management</h2>
                            <p className="text-text-secondary">
                                Manage study materials across all departments
                            </p>
                        </div>
                        <a href="/execom/upload" className="btn btn-primary whitespace-nowrap">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Upload Material
                        </a>
                    </div>

                    {/* Materials Grid */}
                    {materials && materials.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {materials.map((material) => (
                                <div
                                    key={material.id}
                                    className="glass-card hover:scale-[1.02] transition-transform"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary-cyan/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold mb-1 truncate">{material.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span>{material.group?.name || material.department || 'General'}</span>
                                                <span>•</span>
                                                <span>Year {material.year || 'All'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {material.description && (
                                        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                                            {material.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {material.view_count} views
                                        </span>
                                        <span className="uppercase font-semibold">{material.file_type}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={material.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary flex-1 text-sm justify-center"
                                        >
                                            View
                                        </a>
                                        <button className="btn btn-secondary text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button className="btn btn-secondary text-sm text-red-400 hover:bg-red-500/20">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card text-center py-16">
                            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold mb-2">No Materials Yet</h3>
                            <p className="text-text-secondary mb-4">
                                Start by uploading study materials for students
                            </p>
                            <a href="/execom/upload" className="btn btn-primary inline-flex">
                                Upload First Material
                            </a>
                        </div>
                    )}

                    <div className="h-8 sm:h-0 mobile-nav-safe"></div>
                </div>
            </main>
        </DashboardLayout>
    );
}
