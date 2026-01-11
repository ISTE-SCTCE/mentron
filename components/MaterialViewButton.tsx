'use client';

import { useState } from 'react';

interface MaterialViewButtonProps {
    materialId: string;
    fileUrl: string;
    className?: string;
}

/**
 * MaterialViewButton - Tracks view count when student clicks to view material
 * 
 * This component calls the /api/materials/view endpoint to increment the view
 * count before opening the material in a new tab. This ensures accurate tracking.
 */
export function MaterialViewButton({ materialId, fileUrl, className = '' }: MaterialViewButtonProps) {
    const [isTracking, setIsTracking] = useState(false);

    const handleClick = async () => {
        setIsTracking(true);

        try {
            // Track the view
            await fetch('/api/materials/view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ materialId }),
            });
        } catch (error) {
            console.error('Failed to track view:', error);
        } finally {
            setIsTracking(false);
        }

        // Open the material in new tab (regardless of tracking success)
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            onClick={handleClick}
            disabled={isTracking}
            className={`btn btn-primary w-full text-sm justify-center touch-manipulation ${className}`}
        >
            {isTracking ? (
                <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opening...
                </>
            ) : (
                'View Material'
            )}
        </button>
    );
}
