export const AUTH_CONFIG = {
    // 365 days in seconds
    PERSISTENT_SESSION_DURATION: 365 * 24 * 60 * 60,

    // Cookie names
    REMEMBER_ME_COOKIE: 'mentron-remember-me',

    // Cookie options
    COOKIE_OPTIONS: {
        path: '/',
        sameSite: 'lax' as const,
        secure: true,
    }
};
