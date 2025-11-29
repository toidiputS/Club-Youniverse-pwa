/**
 * @file A component for displaying individual generated video clips.
 * It includes standard video controls and a convenient download button that appears on hover.
 */

import React from 'react';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative group">
      <video
        src={src}
        controls
        className="w-full h-full object-cover"
        playsInline // Important for mobile browsers.
        loop
        autoPlay
        muted // Autoplay often requires the video to be muted.
      />
      {/* Download button appears on hover over the video */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={src}
          download={`generated-video-clip.mp4`}
          className="bg-yellow-500 text-gray-900 p-2 rounded-full hover:bg-yellow-400 transition-colors"
          title="Download Clip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
};