import RetroErrorCard from '@/components/ui/RetroErrorCard';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--deep-bg)]">
            <RetroErrorCard message="PAGE NOT FOUND" />
            <div className="mt-8 text-center">
                <p className="text-[var(--text-secondary)] mb-4">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-primary-cyan to-secondary-purple text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
