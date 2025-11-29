/**
 * @file A reusable component for displaying a star rating (e.g., 8 out of 10 stars).
 * It dynamically renders filled and empty stars based on the provided rating.
 */

import React from 'react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    className?: string;
    onVote?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 10, className = '', onVote }) => {
    return (
        <div className={`flex items-center ${className}`}>
            {/* Create an array of stars up to the maxRating */}
            {Array.from({ length: maxRating }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onVote && onVote(i + 1)}
                    className={`focus:outline-none transition-transform hover:scale-110 ${onVote ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!onVote}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};
