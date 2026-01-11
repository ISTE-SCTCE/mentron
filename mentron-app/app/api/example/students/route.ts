import { NextResponse } from 'next/server';
import { createDbOperations, DbValidator } from '@/lib/db/operations';

/**
 * Example API route demonstrating robust database insertion
 * POST /api/example/students
 */

interface StudentInsertData {
    email: string;
    department: string;
    year: number;
    id?: string;
}

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json();
        const { email, department, year, id } = body as StudentInsertData;

        // 1. Input Validation
        const validation = DbValidator.validateRequired(
            { email, department, year },
            ['email', 'department', 'year']
        );

        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields',
                    missing: validation.missing
                },
                { status: 400 }
            );
        }

        // 2. Email validation
        if (!DbValidator.isValidEmail(email)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid email format'
                },
                { status: 400 }
            );
        }

        // 3. Sanitize inputs
        const sanitizedEmail = DbValidator.sanitizeString(email);
        const sanitizedDepartment = DbValidator.sanitizeString(department);

        // 4. Validate year range
        if (year < 1 || year > 4) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Year must be between 1 and 4'
                },
                { status: 400 }
            );
        }

        // 5. Create database operations instance
        const db = await createDbOperations();

        // 6. Prepare data for insertion
        const studentData: Partial<StudentInsertData> = {
            email: sanitizedEmail,
            department: sanitizedDepartment,
            year,
            ...(id && { id }) // Include ID if provided
        };

        // 7. Insert record with error handling
        const result = await db.insertOne('group_members', studentData);

        // 8. Handle result
        if (!result.success) {
            // Map error codes to HTTP status codes
            const statusCode = result.code === 'DUPLICATE_KEY' ? 409
                : result.code === 'PERMISSION_DENIED' ? 403
                    : result.code === 'FOREIGN_KEY_VIOLATION' ? 400
                        : 500;

            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    code: result.code
                },
                { status: statusCode }
            );
        }

        // 9. Return success response
        return NextResponse.json(
            {
                success: true,
                data: result.data,
                message: 'Student created successfully'
            },
            { status: 201 }
        );

    } catch (error: any) {
        // 10. Handle unexpected errors
        console.error('Unexpected error in POST /api/example/students:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * Example: Bulk insert with transaction-like behavior
 * POST /api/example/students/bulk
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { students } = body as { students: StudentInsertData[] };

        // Validate input
        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid input: students array required'
                },
                { status: 400 }
            );
        }

        // Validate each student
        for (const student of students) {
            const validation = DbValidator.validateRequired(
                student,
                ['email', 'department', 'year']
            );

            if (!validation.valid) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid student data`,
                        missing: validation.missing
                    },
                    { status: 400 }
                );
            }

            if (!DbValidator.isValidEmail(student.email)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid email: ${student.email}`
                    },
                    { status: 400 }
                );
            }
        }

        // Create database operations instance
        const db = await createDbOperations();

        // Sanitize all student data
        const sanitizedStudents = students.map(s => ({
            email: DbValidator.sanitizeString(s.email),
            department: DbValidator.sanitizeString(s.department),
            year: s.year,
            ...(s.id && { id: s.id })
        }));

        // Bulk insert
        const result = await db.insertMany('group_members', sanitizedStudents);

        if (!result.success) {
            const statusCode = result.code === 'DUPLICATE_KEY' ? 409 : 500;
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    code: result.code
                },
                { status: statusCode }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: result.data,
                count: result.data?.length || 0,
                message: `Successfully created ${result.data?.length || 0} students`
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Unexpected error in PUT /api/example/students/bulk:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}
