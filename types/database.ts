export type UserRole = 'chairman' | 'execom' | 'student';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    department?: string;
    year?: number;
    name?: string;
    created_at: string;
}

export interface Admin {
    id: string;
    email: string;
    role: 'chairman' | 'execom';
    department: string;
    position?: string;
    can_view_analytics: boolean;
    is_active: boolean;
    created_at: string;
}

export interface Student {
    id: string;
    email: string;
    department: string;
    year: number;
    group_id?: string;
    created_at: string;
}

export interface Group {
    id: string;
    name: string;
    department: string;
    year: number;
    created_at: string;
}

export interface Material {
    id: string;
    title: string;
    description?: string;
    file_url: string;
    file_type: string;
    department: string;
    year?: number;
    uploaded_by: string;
    view_count: number;
    created_at: string;
}

export interface MaterialView {
    id: string;
    material_id: string;
    user_id: string;
    viewed_at: string;
}
