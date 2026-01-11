'use client';

export default function LandingPage() {
    return (
        <iframe
            src="/landing/index.html"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                zIndex: 9999
            }}
            title="MENTRON Landing Page"
        />
    );
}
