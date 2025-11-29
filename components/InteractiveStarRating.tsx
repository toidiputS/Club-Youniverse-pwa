/**
 * @file A reusable component for interactive star ratings (1-10).
 * It allows users to hover and click to select a rating.
 */
import React, { useState } from 'react';

interface InteractiveStarRatingProps {
    onRate: (rating: number) => void;
    currentRating: number | null; // The user's submitted rating
    averageRating?: number;
    maxRating?: number;
    className?: string;
}

export const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({ 
    onRate,
    currentRating,
    averageRating,
    maxRating = 10, 
    className = '' 
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const hasVoted = currentRating !== null;

    const displayRating = hasVoted ? currentRating : hoverRating;

    return (
        <div className={`flex flex-col items-center ${className}`}>
             <div className="flex items-center" onMouseLeave={() => setHoverRating(null)}>
                {Array.from({ length: maxRating }, (_, i) => {
                    const ratingValue = i + 1;
                    return (
                        <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-8 w-8 transition-colors duration-100 ${!hasVoted ? 'cursor-pointer' : 'cursor-default'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            onMouseEnter={() => !hasVoted && setHoverRating(ratingValue)}
                            onClick={() => !hasVoted && onRate(ratingValue)}
                        >
                            <path 
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                className={ratingValue <= (displayRating ?? 0) ? 'text-yellow-400' : 'text-gray-600'}
                            />
                        </svg>
                    )
                })}
            </div>
             <div className="h-6 mt-2">
                {hasVoted ? (
                     <p className="text-green-400 font-bold">Thanks for rating!</p>
                ) : averageRating !== undefined ? (
                    <p className="text-gray-400">
                        Current Average: <span className="font-bold text-white">{averageRating.toFixed(2)}</span>
                    </p>
                ) : (
                    <p className="text-gray-500">Rate this track</p>
                )}
            </div>
        </div>
    );
};