/**
 * @file This component serves as the main workspace for music video production.
 * It displays the generated storyboard, the status of each media clip (video/image),
 * and provides controls to combine the final video or regenerate individual clips.
 */

import React from "react";
import type { SongDetails, StoryboardScene, GeneratedMedia } from "../types";
import { SectionCard } from "./SectionCard";
import { Loader } from "./Loader";
import { VideoPlayer } from "./VideoPlayer";

interface ProductionStudioProps {
  songDetails: SongDetails;
  storyboard: StoryboardScene[];
  generatedMedia: GeneratedMedia[];
  isGenerating: boolean;
  generationStatusMessage: string;
  isCombining: boolean;
  finalVideoUrl: string | null;
  onCombine: () => void;
  onRegenerate: (sceneNumber: number) => void;
}

// Map media generation statuses to user-friendly messages.
const statusMessages: { [key in GeneratedMedia["status"]]: string } = {
  pending: "Queued for generation...",
  generating: "Generating... this may take a few minutes.",
  complete: "Generation complete.",
  failed: "Generation failed.",
};

export const ProductionStudio: React.FC<ProductionStudioProps> = ({
  songDetails,
  storyboard,
  generatedMedia,
  isGenerating,
  generationStatusMessage,
  isCombining,
  finalVideoUrl,
  onCombine,
  onRegenerate,
}) => {
  // A flag to check if all clips have been successfully generated.
  const allClipsDone =
    !isGenerating &&
    storyboard.length > 0 &&
    generatedMedia.every((v) => v.status === "complete");

  /**
   * Handles the download of the final combined video.
   */
  const handleDownload = () => {
    if (!finalVideoUrl) return;
    const a = document.createElement("a");
    a.href = finalVideoUrl;
    a.download = `${(songDetails.title || "song").replace(/\s/g, "_")}_Music_Video.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* Header section with song details and overall status */}
      <SectionCard>
        <div className="p-8">
          <div>
            <h2 className="text-3xl font-bold font-display text-[var(--accent-primary)] mb-1">
              {songDetails.title}
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              {songDetails.artist || "Unknown Artist"}
            </p>
          </div>
          {isGenerating && (
            <p className="text-[var(--accent-primary)] animate-pulse">
              {generationStatusMessage}
            </p>
          )}
          {!isGenerating && allClipsDone && !finalVideoUrl && (
            <p className="text-green-400">
              All assets are ready! You can now create the final video.
            </p>
          )}
          {!isGenerating && finalVideoUrl && (
            <p className="text-green-400">
              Production Complete! Preview and download your final music video
              below.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Section for combining and downloading the final video */}
      {allClipsDone && (
        <SectionCard>
          <div className="p-8 text-center">
            {finalVideoUrl ? (
              <>
                <h3 className="text-2xl font-bold font-display text-green-400 mb-4">
                  Your Music Video is Ready!
                </h3>
                <div className="max-w-2xl mx-auto my-4 bg-black rounded-lg shadow-lg">
                  <video
                    src={finalVideoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-block bg-[var(--accent-secondary)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300"
                >
                  Download Final Video (.webm)
                </button>
              </>
            ) : isCombining ? (
              <Loader message="Assembling final cut... This may take a moment." />
            ) : (
              <>
                <h3 className="text-2xl font-bold font-display text-[var(--accent-primary)] mb-4">
                  Ready to Assemble?
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Combine the generated clips, images, and your audio into a
                  final music video.
                </p>
                <button
                  onClick={onCombine}
                  className="bg-[var(--accent-secondary)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300"
                >
                  Create Final Music Video
                </button>
              </>
            )}
          </div>
        </SectionCard>
      )}

      {/* Grid displaying each storyboard scene and its generation status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {storyboard.map((scene) => {
          const media = generatedMedia.find((v) => v.scene === scene.scene);
          const sceneTitle = `${scene.type.charAt(0).toUpperCase() + scene.type.slice(1)} - Scene ${scene.scene}`;

          return (
            <div key={scene.scene} className="group">
              <SectionCard className="h-full transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-xl font-bold font-display text-[var(--accent-primary)]">
                    {sceneTitle}
                  </h3>
                  <p className="text-[var(--text-secondary)] mt-2 text-sm italic">
                    "{scene.description}"
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-mono bg-black/20 p-2 rounded-md">
                    Prompt: {scene.prompt}
                  </p>

                  {/* Media preview area */}
                  <div className="mt-4 flex-grow flex items-center justify-center bg-black/30 rounded-lg aspect-video">
                    {media?.status === "generating" && (
                      <Loader message="Generating..." />
                    )}
                    {media?.status === "complete" &&
                      media.url &&
                      (media.type === "video" ? (
                        <VideoPlayer src={media.url} />
                      ) : (
                        <img
                          src={media.url}
                          alt={`Generated image for scene ${media.scene}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ))}
                    {media?.status === "pending" && (
                      <p className="text-gray-400">{statusMessages.pending}</p>
                    )}
                    {media?.status === "failed" && (
                      <div className="text-red-400 text-center p-2">
                        <p className="font-bold">{statusMessages.failed}</p>
                        {media.error && (
                          <p className="text-xs mt-1 font-mono bg-red-900/20 p-2 rounded">
                            {media.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Status and Regenerate button */}
                  <div className="mt-4 text-center text-sm flex items-center justify-center gap-2">
                    <p
                      className={`capitalize font-semibold ${
                        media?.status === "complete"
                          ? "text-green-400"
                          : media?.status === "generating"
                            ? "text-yellow-400 animate-pulse"
                            : media?.status === "failed"
                              ? "text-red-400"
                              : "text-gray-400"
                      }`}
                    >
                      Status: {media?.status}
                    </p>
                    {(media?.status === "complete" ||
                      media?.status === "failed") && (
                      <button
                        onClick={() => onRegenerate(scene.scene)}
                        disabled={isGenerating}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-1 rounded-full text-xs transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                        title="Regenerate this clip"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
