'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ACADEMIC_YEARS } from '@/lib/constants';

interface MaterialUploadFormProps {
    userRole: 'chairman' | 'execom';
}

interface Group {
    id: string;
    name: string;
    department: string;
    year: string | null;
}

export function MaterialUploadForm({ userRole }: MaterialUploadFormProps) {
    const supabase = createClient();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        year: '',
        groupId: '',
    });

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/groups');
                if (!response.ok) throw new Error('Failed to fetch groups');
                const data = await response.json();
                setGroups(data.groups || []);
            } catch (error) {
                console.error('Error loading groups:', error);
            } finally {
                setLoadingGroups(false);
            }
        };

        fetchGroups();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setFeedback(null);

        if (!file) {
            setFeedback({ type: 'error', message: 'Please select a file to upload.' });
            setUploading(false);
            return;
        }

        if (!formData.groupId) {
            setFeedback({ type: 'error', message: 'Please select a group.' });
            setUploading(false);
            return;
        }

        try {
            // 1. Upload File to Storage (Organized by Group ID)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            // Use group ID and Year for path organization
            const filePath = `${formData.groupId}/${formData.year}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error('Failed to upload file to storage.');
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);

            // 3. Insert Metadata into Database
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not authenticated');

            // Derive file_type from file extension
            const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'OTHER';
            const fileTypeMap: Record<string, string> = {
                'PDF': 'PDF',
                'DOC': 'DOC',
                'DOCX': 'DOC',
                'PPT': 'PPT',
                'PPTX': 'PPT',
                'MP4': 'VIDEO',
                'MOV': 'VIDEO',
                'AVI': 'VIDEO'
            };
            const fileType = fileTypeMap[fileExtension] || 'OTHER';

            // Get department from selected group
            const selectedGroup = groups.find(g => g.id === formData.groupId);
            const department = selectedGroup?.department || '';

            const { error: dbError } = await supabase
                .from('materials')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    year: formData.year,
                    group_id: formData.groupId,
                    department: department,
                    file_type: fileType,
                    file_url: publicUrl,
                    uploaded_by: user.id
                });

            if (dbError) {
                console.error('DB Insert Error Details:', JSON.stringify(dbError, null, 2));
                console.error('DB Error Message:', dbError.message);
                console.error('DB Error Code:', dbError.code);
                console.error('DB Error Details:', dbError.details);
                // Attempt to cleanup file if DB insert fails
                await supabase.storage.from('materials').remove([filePath]);
                throw new Error(`Failed to save material metadata: ${dbError.message || 'Unknown database error'}`);
            }

            setFeedback({ type: 'success', message: 'Material uploaded successfully!' });
            setFormData({
                title: '',
                description: '',
                year: '',
                groupId: '',
            });
            setFile(null);

            router.refresh();

        } catch (error: any) {
            console.error('Submission Error:', error);
            setFeedback({
                type: 'error',
                message: error.message || 'An unexpected error occurred.'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card">
            <h3 className="text-xl font-semibold mb-6">Material Details</h3>

            {feedback && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {feedback.type === 'success' ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Material Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Digital Electronics Notes"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the material..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all resize-none"
                    />
                </div>

                {/* Group and Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Group *
                        </label>
                        {loadingGroups ? (
                            <div className="text-sm text-text-secondary animate-pulse">Loading groups...</div>
                        ) : groups.length === 0 ? (
                            <div className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                There is no group. Please create a group to upload the file.
                            </div>
                        ) : (
                            <select
                                required
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                            >
                                <option value="">Select Group</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Year *
                        </label>
                        <select
                            required
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/20 transition-all"
                        >
                            <option value="">Select Year</option>
                            {ACADEMIC_YEARS.map((yr) => (
                                <option key={yr.value} value={yr.value}>
                                    {yr.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Upload File *
                    </label>
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-primary-cyan/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            required
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                        />
                        <div className="pointer-events-none">
                            {file ? (
                                <div className="flex flex-col items-center text-primary-cyan">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="font-semibold">{file.name}</p>
                                    <p className="text-sm opacity-75">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-text-secondary mb-1">Click to upload or drag and drop</p>
                                    <p className="text-xs text-text-secondary">PDF, DOC, PPT, or Video (max 50MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={uploading || groups.length === 0}
                    className="btn btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Material
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
