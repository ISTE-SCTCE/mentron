import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';

export default async function ChairmanMaterials() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify chairman access
    const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!admin || admin.role !== 'chairman') {
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

    return (
        <DashboardLayout userRole="chairman">
            <main className="relative min-h-screen p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6">All Materials</h1>

                    {materials && materials.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {materials.map((material) => (
                                <div key={material.id} className="glass-card hover:scale-[1.02] transition-transform">
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
                                        <span>{material.group?.name || material.department || 'General'}</span>
                                    </div>
                                    <a
                                        href={material.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary w-full text-sm justify-center"
                                    >
                                        View Material
                                    </a>
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
                                Materials will appear here once uploaded.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}
