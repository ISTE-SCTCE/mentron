/**
 * Unit tests for database operations
 * Run with: npm test lib/db/operations.test.ts
 */

import { DbOperations, DbValidator, DbResult } from './operations';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

describe('DbValidator', () => {
    describe('isValidEmail', () => {
        it('should validate correct email addresses', () => {
            expect(DbValidator.isValidEmail('test@example.com')).toBe(true);
            expect(DbValidator.isValidEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(DbValidator.isValidEmail('invalid')).toBe(false);
            expect(DbValidator.isValidEmail('test@')).toBe(false);
            expect(DbValidator.isValidEmail('@example.com')).toBe(false);
        });
    });

    describe('isValidUUID', () => {
        it('should validate correct UUIDs', () => {
            expect(DbValidator.isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        });

        it('should reject invalid UUIDs', () => {
            expect(DbValidator.isValidUUID('invalid-uuid')).toBe(false);
            expect(DbValidator.isValidUUID('123')).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        it('should remove dangerous characters', () => {
            expect(DbValidator.sanitizeString('  <script>alert("xss")</script>  ')).toBe('scriptalert("xss")/script');
            expect(DbValidator.sanitizeString('  normal text  ')).toBe('normal text');
        });
    });

    describe('validateRequired', () => {
        it('should validate all required fields are present', () => {
            const data = { email: 'test@test.com', name: 'Test' };
            const result = DbValidator.validateRequired(data, ['email', 'name']);
            expect(result.valid).toBe(true);
            expect(result.missing).toBeUndefined();
        });

        it('should detect missing required fields', () => {
            const data = { email: 'test@test.com' };
            const result = DbValidator.validateRequired(data, ['email', 'name']);
            expect(result.valid).toBe(false);
            expect(result.missing).toEqual(['name']);
        });
    });
});

describe('DbOperations', () => {
    let mockSupabase: any;
    let dbOps: DbOperations;

    beforeEach(() => {
        // Create mock Supabase client
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn()
        };

        dbOps = new DbOperations(mockSupabase);
    });

    describe('insertOne', () => {
        it('should successfully insert a single record', async () => {
            const mockData = { id: '123', email: 'test@test.com' };
            mockSupabase.single.mockResolvedValue({
                data: mockData,
                error: null
            });

            const result = await dbOps.insertOne('users', { email: 'test@test.com' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.insert).toHaveBeenCalled();
        });

        it('should handle duplicate key errors', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key violation' }
            });

            const result = await dbOps.insertOne('users', { email: 'test@test.com' });

            expect(result.success).toBe(false);
            expect(result.code).toBe('DUPLICATE_KEY');
            expect(result.error).toContain('already exists');
        });

        it('should handle foreign key violations', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { code: '23503', message: 'foreign key violation' }
            });

            const result = await dbOps.insertOne('users', { group_id: 'invalid' });

            expect(result.success).toBe(false);
            expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
        });

        it('should handle not null violations', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { code: '23502', message: 'null value in column' }
            });

            const result = await dbOps.insertOne('users', {});

            expect(result.success).toBe(false);
            expect(result.code).toBe('NOT_NULL_VIOLATION');
        });

        it('should handle permission denied errors', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { code: '42501', message: 'permission denied' }
            });

            const result = await dbOps.insertOne('users', { email: 'test@test.com' });

            expect(result.success).toBe(false);
            expect(result.code).toBe('PERMISSION_DENIED');
        });

        it('should handle exceptions', async () => {
            mockSupabase.single.mockRejectedValue(new Error('Connection failed'));

            const result = await dbOps.insertOne('users', { email: 'test@test.com' });

            expect(result.success).toBe(false);
            expect(result.code).toBe('EXCEPTION');
        });
    });

    describe('insertMany', () => {
        it('should successfully insert multiple records', async () => {
            const mockData = [
                { id: '1', email: 'test1@test.com' },
                { id: '2', email: 'test2@test.com' }
            ];

            mockSupabase.select.mockResolvedValue({
                data: mockData,
                error: null
            });

            const result = await dbOps.insertMany('users', [
                { email: 'test1@test.com' },
                { email: 'test2@test.com' }
            ]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(result.data?.length).toBe(2);
        });

        it('should handle bulk insert errors', async () => {
            mockSupabase.select.mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key' }
            });

            const result = await dbOps.insertMany('users', [
                { email: 'test@test.com' }
            ]);

            expect(result.success).toBe(false);
            expect(result.code).toBe('DUPLICATE_KEY');
        });
    });

    describe('update', () => {
        it('should successfully update records', async () => {
            const mockData = [{ id: '123', email: 'updated@test.com' }];
            mockSupabase.select.mockResolvedValue({
                data: mockData,
                error: null
            });

            const result = await dbOps.update(
                'users',
                { email: 'updated@test.com' },
                { id: '123' }
            );

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
        });
    });

    describe('delete', () => {
        it('should successfully delete records', async () => {
            const mockData = [{ id: '123' }];
            mockSupabase.select.mockResolvedValue({
                data: mockData,
                error: null
            });

            const result = await dbOps.delete('users', { id: '123' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });
    });

    describe('query', () => {
        it('should successfully query records', async () => {
            const mockData = [
                { id: '1', email: 'test1@test.com' },
                { id: '2', email: 'test2@test.com' }
            ];

            mockSupabase.select.mockReturnValue({
                ...mockSupabase,
                then: (resolve: any) => resolve({ data: mockData, error: null })
            });

            const result = await dbOps.query('users', { department: 'ECE' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });

        it('should apply filters, ordering, and limits', async () => {
            mockSupabase.select.mockReturnValue({
                ...mockSupabase,
                then: (resolve: any) => resolve({ data: [], error: null })
            });

            await dbOps.query('users',
                { department: 'ECE' },
                {
                    select: 'id,email',
                    orderBy: { column: 'created_at', ascending: false },
                    limit: 10
                }
            );

            expect(mockSupabase.select).toHaveBeenCalledWith('id,email');
            expect(mockSupabase.eq).toHaveBeenCalledWith('department', 'ECE');
            expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(mockSupabase.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('transaction', () => {
        it('should execute all operations successfully', async () => {
            const operations = [
                async () => ({ success: true, data: { id: '1' } }),
                async () => ({ success: true, data: { id: '2' } })
            ];

            const result = await dbOps.transaction(operations);

            expect(result.success).toBe(true);
            expect(result.data?.length).toBe(2);
        });

        it('should rollback on failure', async () => {
            const operations = [
                async () => ({ success: true, data: { id: '1' } }),
                async () => ({ success: false, error: 'Failed', code: 'ERROR' })
            ];

            const result = await dbOps.transaction(operations);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed');
        });
    });
});

describe('Integration Tests', () => {
    // These would be run against a test database
    describe('Real database operations', () => {
        it.skip('should insert and retrieve a record', async () => {
            // This would use a real Supabase connection
            // Skipped in unit tests, run separately in integration tests
        });

        it.skip('should handle concurrent inserts', async () => {
            // Test race conditions and locking
        });

        it.skip('should properly rollback failed transactions', async () => {
            // Test transaction rollback behavior
        });
    });
});
