/**
 * Performance utilities for the MENTRON dashboard
 * Provides timing, caching, and monitoring capabilities
 */

type CachedValue<T> = {
    value: T;
    timestamp: number;
    expiresAt: number;
};

// Simple in-memory cache
const cache = new Map<string, CachedValue<unknown>>();

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
    fn: () => Promise<T>,
    label?: string
): Promise<{ result: T; durationMs: number }> {
    const start = performance.now();
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);

    if (label) {
        console.log(`[Perf] ${label}: ${durationMs}ms`);
    }

    return { result, durationMs };
}

/**
 * Get value from cache or compute it
 * @param key Cache key
 * @param compute Function to compute value if not cached
 * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
 */
export async function getCached<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
): Promise<T> {
    const now = Date.now();
    const cached = cache.get(key) as CachedValue<T> | undefined;

    if (cached && cached.expiresAt > now) {
        console.log(`[Cache] Hit: ${key}`);
        return cached.value;
    }

    console.log(`[Cache] Miss: ${key}`);
    const value = await compute();

    cache.set(key, {
        value,
        timestamp: now,
        expiresAt: now + ttlMs,
    });

    return value;
}

/**
 * Invalidate specific cache entry
 */
export function invalidateCache(key: string): boolean {
    return cache.delete(key);
}

/**
 * Invalidate all cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string): number {
    let count = 0;
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
            count++;
        }
    }
    return count;
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delayMs);
    };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitMs: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limitMs);
        }
    };
}

/**
 * Simple performance logger for sub-second validation
 */
export function logPerformance(operation: string, durationMs: number): void {
    const status = durationMs < 1000 ? '✓' : '⚠️';
    console.log(`[Perf] ${status} ${operation}: ${durationMs}ms ${durationMs >= 1000 ? '(exceeds 1s threshold)' : ''}`);
}
