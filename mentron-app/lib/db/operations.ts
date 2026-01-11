import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database operation result type
 */
export type DbResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
};

/**
 * Database operation logger
 */
class DbLogger {
    private static log(level: 'info' | 'error' | 'warn', operation: string, details: any) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            operation,
            details
        };

        if (level === 'error') {
            console.error('[DB Error]', logEntry);
        } else if (level === 'warn') {
            console.warn('[DB Warning]', logEntry);
        } else {
            console.log('[DB Info]', logEntry);
        }
    }

    static info(operation: string, details: any) {
        this.log('info', operation, details);
    }

    static error(operation: string, details: any) {
        this.log('error', operation, details);
    }

    static warn(operation: string, details: any) {
        this.log('warn', operation, details);
    }
}

/**
 * Database operations utility class
 */
export class DbOperations {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Insert a single record into a table
     */
    async insertOne<T>(
        table: string,
        data: Partial<T>,
        options?: { returning?: boolean }
    ): Promise<DbResult<T>> {
        try {
            DbLogger.info('insertOne', { table, data });

            const query = this.supabase
                .from(table)
                .insert(data);

            const { data: result, error } = options?.returning !== false
                ? await query.select().single()
                : await query;

            if (error) {
                DbLogger.error('insertOne', { table, error });
                return this.handleError(error);
            }

            DbLogger.info('insertOne success', { table, result });
            return { success: true, data: result as T };
        } catch (err: any) {
            DbLogger.error('insertOne exception', { table, error: err });
            return {
                success: false,
                error: err.message || 'Unknown error occurred',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Insert multiple records into a table
     */
    async insertMany<T>(
        table: string,
        data: Partial<T>[],
        options?: { returning?: boolean }
    ): Promise<DbResult<T[]>> {
        try {
            DbLogger.info('insertMany', { table, count: data.length });

            const query = this.supabase
                .from(table)
                .insert(data);

            const { data: result, error } = options?.returning !== false
                ? await query.select()
                : await query;

            if (error) {
                DbLogger.error('insertMany', { table, error });
                return this.handleError(error);
            }

            DbLogger.info('insertMany success', { table, count: result?.length || 0 });
            return { success: true, data: result as T[] };
        } catch (err: any) {
            DbLogger.error('insertMany exception', { table, error: err });
            return {
                success: false,
                error: err.message || 'Unknown error occurred',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Update records in a table
     */
    async update<T>(
        table: string,
        data: Partial<T>,
        filter: Record<string, any>
    ): Promise<DbResult<T[]>> {
        try {
            DbLogger.info('update', { table, filter, data });

            let query = this.supabase
                .from(table)
                .update(data);

            // Apply filters
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const { data: result, error } = await query.select();

            if (error) {
                DbLogger.error('update', { table, error });
                return this.handleError(error);
            }

            DbLogger.info('update success', { table, count: result?.length || 0 });
            return { success: true, data: result as T[] };
        } catch (err: any) {
            DbLogger.error('update exception', { table, error: err });
            return {
                success: false,
                error: err.message || 'Unknown error occurred',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Delete records from a table
     */
    async delete<T>(
        table: string,
        filter: Record<string, any>
    ): Promise<DbResult<T[]>> {
        try {
            DbLogger.info('delete', { table, filter });

            let query = this.supabase
                .from(table)
                .delete();

            // Apply filters
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const { data: result, error } = await query.select();

            if (error) {
                DbLogger.error('delete', { table, error });
                return this.handleError(error);
            }

            DbLogger.info('delete success', { table, count: result?.length || 0 });
            return { success: true, data: result as T[] };
        } catch (err: any) {
            DbLogger.error('delete exception', { table, error: err });
            return {
                success: false,
                error: err.message || 'Unknown error occurred',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Query records from a table
     */
    async query<T>(
        table: string,
        filter?: Record<string, any>,
        options?: {
            select?: string;
            orderBy?: { column: string; ascending?: boolean };
            limit?: number;
        }
    ): Promise<DbResult<T[]>> {
        try {
            DbLogger.info('query', { table, filter, options });

            let query = this.supabase
                .from(table)
                .select(options?.select || '*');

            // Apply filters
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            // Apply ordering
            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending !== false
                });
            }

            // Apply limit
            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data: result, error } = await query;

            if (error) {
                DbLogger.error('query', { table, error });
                return this.handleError(error);
            }

            DbLogger.info('query success', { table, count: result?.length || 0 });
            return { success: true, data: result as T[] };
        } catch (err: any) {
            DbLogger.error('query exception', { table, error: err });
            return {
                success: false,
                error: err.message || 'Unknown error occurred',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Execute a transaction (multiple operations atomically)
     * Note: Supabase doesn't support traditional transactions,
     * but we can use RPC functions for atomic operations
     */
    async transaction<T>(
        operations: Array<() => Promise<DbResult<any>>>
    ): Promise<DbResult<T[]>> {
        try {
            DbLogger.info('transaction', { operationCount: operations.length });

            const results: any[] = [];

            for (const operation of operations) {
                const result = await operation();
                if (!result.success) {
                    DbLogger.error('transaction failed', { result });
                    // Rollback would happen here if supported
                    return {
                        success: false,
                        error: result.error || 'Transaction failed',
                        code: result.code || 'TRANSACTION_FAILED'
                    };
                }
                results.push(result.data);
            }

            DbLogger.info('transaction success', { resultCount: results.length });
            return { success: true, data: results as T[] };
        } catch (err: any) {
            DbLogger.error('transaction exception', { error: err });
            return {
                success: false,
                error: err.message || 'Transaction failed',
                code: 'EXCEPTION'
            };
        }
    }

    /**
     * Handle database errors and return user-friendly messages
     */
    private handleError(error: any): DbResult<never> {
        // Duplicate key violation
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
            return {
                success: false,
                error: 'A record with this information already exists',
                code: 'DUPLICATE_KEY'
            };
        }

        // Foreign key violation
        if (error.code === '23503' || error.message?.includes('foreign key')) {
            return {
                success: false,
                error: 'Referenced record does not exist',
                code: 'FOREIGN_KEY_VIOLATION'
            };
        }

        // Not null violation
        if (error.code === '23502' || error.message?.includes('null value')) {
            return {
                success: false,
                error: 'Required field is missing',
                code: 'NOT_NULL_VIOLATION'
            };
        }

        // Check constraint violation
        if (error.code === '23514' || error.message?.includes('check constraint')) {
            return {
                success: false,
                error: 'Invalid data provided',
                code: 'CHECK_VIOLATION'
            };
        }

        // Permission denied
        if (error.code === '42501' || error.message?.includes('permission denied')) {
            return {
                success: false,
                error: 'You do not have permission to perform this action',
                code: 'PERMISSION_DENIED'
            };
        }

        // Generic error
        return {
            success: false,
            error: error.message || 'Database operation failed',
            code: error.code || 'DB_ERROR'
        };
    }
}

/**
 * Create a new DbOperations instance
 */
export async function createDbOperations() {
    const supabase = await createClient();
    return new DbOperations(supabase);
}

/**
 * Validation utilities
 */
export class DbValidator {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate UUID format
     */
    static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Sanitize string input
     */
    static sanitizeString(input: string): string {
        return input.trim().replace(/[<>]/g, '');
    }

    /**
     * Validate required fields
     */
    static validateRequired<T>(
        data: Partial<T>,
        requiredFields: (keyof T)[]
    ): { valid: boolean; missing?: string[] } {
        const missing = requiredFields.filter(field => !data[field]);
        return {
            valid: missing.length === 0,
            missing: missing.length > 0 ? missing.map(String) : undefined
        };
    }
}
