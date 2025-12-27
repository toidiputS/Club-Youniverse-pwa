/**
 * @file This is the main state machine and orchestrator for the AI Music Video Generator.
 * It manages the entire process from API key selection, to uploading, storyboard generation,
 * media clip generation (in a managed queue), and final video combination.
 */

import React, { useState, useEffect, useCallback } from "react";
import { UploadScreen } from "./UploadScreen";
import { ProductionStudio } from "./ProductionStudio";
import { Loader } from "./Loader";
import {
  analyzeSongAndGenerateStoryboard,
  generateVideoClip,
  generateImage,
} from "../services/geminiService";
import { combineMedia } from "../services/videoCombiner";
import type {
  StoryboardScene,
  GeneratedMedia,
  AppState,
  SongDetails,
  GenerationStage,
  GalleryItem,
  Profile,
} from "../types";
import { AppStatus } from "../types";

interface MusicVideoGeneratorProps {
  onBackToStudio: () => void;
  onCreationComplete: (item: Omit<GalleryItem, "id">) => void;
  onSongSubmitted: (details: {
    title: string;
    artist: string;
    audioFile: File;
    durationSec: number;
    source?: "suno" | "producer.ai" | "mubert" | "upload";
  }) => void;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

// List of Veo models to use for video generation, allowing for rotation to manage rate limits.
const VEO_MODELS = [
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview",
];

export const MusicVideoGenerator: React.FC<MusicVideoGeneratorProps> = ({
  onBackToStudio,
  onCreationComplete,
  onSongSubmitted,
  profile,
  setProfile,
}) => {
  // State for the entire generation flow.
  const [appStatus, setAppStatus] = useState<AppState>(AppStatus.UPLOAD);
  const [songDetails, setSongDetails] = useState<SongDetails | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCombining, setIsCombining] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  // State for managing the generation queue.
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [lastBatchStart, setLastBatchStart] = useState(0); // Tracks time for API cooldowns.
  const [generationStatusMessage, setGenerationStatusMessage] = useState(
    "Production in progress...",
  );
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("INITIAL");
  const [nextVideoModelIndex, setNextVideoModelIndex] = useState(0); // Rotates through VEO_MODELS.

  // Cleanup effect to revoke object URLs and prevent memory leaks.
  useEffect(() => {
    return () => {
      generatedMedia.forEach((media) => {
        if (media.url) URL.revokeObjectURL(media.url);
      });
      if (finalVideoUrl) {
        URL.revokeObjectURL(finalVideoUrl);
      }
    };
  }, [generatedMedia, finalVideoUrl]);

  // Resets the component state to allow for a new project.
  const resetStateForNewProject = () => {
    setSongDetails(null);
    setStoryboard([]);
    setGeneratedMedia([]);
    setError(null);
    setFinalVideoUrl(null);
    setIsCombining(false);
    setIsQueueRunning(false);
    setLastBatchStart(0);
    setGenerationStage("INITIAL");
    setNextVideoModelIndex(0);
    setGenerationStatusMessage("Production in progress...");
  };

  /**
   * Handles the submission from the UploadScreen.
   * It triggers storyboard generation and prepares the media generation queue.
   */
  const handleUploadSubmit = async (details: SongDetails) => {
    resetStateForNewProject();
    setSongDetails(details);
    setAppStatus(AppStatus.GENERATING_STORYBOARD);

    // Add the uploaded song to the central song library
    onSongSubmitted({
      title: details.title,
      artist: details.artist,
      audioFile: details.audioFile,
      durationSec: details.duration || 0,
      source: details.source,
    });

    if (!details.duration) {
      setError(
        "Could not determine audio duration. Please try uploading the file again.",
      );
      setAppStatus(AppStatus.UPLOAD);
      return;
    }

    try {
      const scenes = await analyzeSongAndGenerateStoryboard(
        details,
        details.duration,
      );
      setStoryboard(scenes);
      setGeneratedMedia(
        scenes.map((scene) => ({
          scene: scene.scene,
          type: scene.type,
          status: "pending",
          url: null,
        })),
      );
      setAppStatus(AppStatus.GENERATING_MEDIA);
    } catch (e: any) {
      console.error(e);
      setError(
        e.message ||
          "Failed to generate storyboard. Please check the console for details.",
      );
      setAppStatus(AppStatus.UPLOAD);
    }
  };

  /**
   * Manages the sequential generation of media clips.
   * This function processes pending items in batches, respects API cooldowns,
   * and handles failures gracefully.
   */
  const manageGenerationQueue = useCallback(async () => {
    setIsQueueRunning(true);
    const getPending = (type: "video" | "image") =>
      storyboard.filter(
        (s) =>
          s.type === type &&
          generatedMedia.find((m) => m.scene === s.scene)?.status === "pending",
      );

    // If nothing is pending, the generation is complete.
    if (generatedMedia.every((m) => m.status !== "pending")) {
      setAppStatus(AppStatus.COMPLETE);
      setGenerationStatusMessage("All assets are ready!");
      setIsQueueRunning(false);
      return;
    }

    const aspectRatio = songDetails?.aspectRatio || "16:9";
    const COOLDOWN = 61000; // ~1 minute cooldown for video generation APIs.
    const timeSince = Date.now() - lastBatchStart;

    // Enforce cooldown between video batches.
    if (lastBatchStart !== 0 && timeSince < COOLDOWN) {
      const waitTime = COOLDOWN - timeSince;
      setGenerationStatusMessage(
        `Waiting ${Math.round(waitTime / 1000)}s for API cooldown...`,
      );
      setTimeout(() => setIsQueueRunning(false), waitTime);
      return;
    }

    try {
      // Logic to process different stages (videos, then images, then remaining videos).
      let currentStage = generationStage;
      if (currentStage === "INITIAL") {
        const pendingVideos = getPending("video");
        currentStage =
          pendingVideos.length > 0 ? "VIDEO_BLOCK_1" : "IMAGE_BLOCK";
        setGenerationStage(currentStage);
      }

      // Process the first batch of videos.
      if (currentStage === "VIDEO_BLOCK_1") {
        const pendingVideos = getPending("video");
        if (
          pendingVideos.length === 0 ||
          nextVideoModelIndex >= VEO_MODELS.length
        ) {
          setGenerationStage("IMAGE_BLOCK");
          setNextVideoModelIndex(0);
          setIsQueueRunning(false);
          return;
        }
        const videoBatch = pendingVideos.slice(0, 2);
        const modelToUse = VEO_MODELS[nextVideoModelIndex];
        setGenerationStatusMessage(
          `Block 1: Generating ${videoBatch.length} video(s) with ${modelToUse}...`,
        );
        setLastBatchStart(Date.now());
        setGeneratedMedia((prev) =>
          prev.map((m) =>
            videoBatch.some((s) => s.scene === m.scene)
              ? { ...m, status: "generating" }
              : m,
          ),
        );

        const promises = videoBatch.map((s) =>
          generateVideoClip(s.prompt, aspectRatio, modelToUse).then(
            (result) => ({ scene: s, url: result.url }),
          ),
        );
        const results = await Promise.allSettled(promises);

        setGeneratedMedia((prev) =>
          prev.map((mediaItem) => {
            const resultIndex = results.findIndex(
              (_res, i) => videoBatch[i].scene === mediaItem.scene,
            );
            if (resultIndex === -1) return mediaItem;
            const result = results[resultIndex];
            if (result.status === "fulfilled") {
              return {
                ...mediaItem,
                status: "complete",
                url: result.value.url,
              };
            } else {
              const errorMessage =
                result.reason instanceof Error
                  ? result.reason.message
                  : "An unknown error occurred.";
              console.error(`Scene ${mediaItem.scene} failed:`, result.reason);
              return { ...mediaItem, status: "failed", error: errorMessage };
            }
          }),
        );

        setNextVideoModelIndex((prev) => prev + 1);
        setIsQueueRunning(false);
        return;
      }

      // Process all images in a single stage.
      if (currentStage === "IMAGE_BLOCK") {
        const pendingImages = getPending("image");
        if (pendingImages.length === 0) {
          setGenerationStage("VIDEO_BLOCK_2");
          setIsQueueRunning(false);
          return;
        }

        const imageBatch = pendingImages.slice(0, 20); // Can process more images at once.
        setGenerationStatusMessage(
          `Generating a batch of ${imageBatch.length} images...`,
        );
        setLastBatchStart(Date.now());
        setGeneratedMedia((prev) =>
          prev.map((m) =>
            imageBatch.some((s) => s.scene === m.scene)
              ? { ...m, status: "generating" }
              : m,
          ),
        );

        const promises = imageBatch.map((s) =>
          generateImage(s.prompt, aspectRatio).then((result) => ({
            scene: s,
            url: result.url,
          })),
        );
        const results = await Promise.allSettled(promises);

        setGeneratedMedia((prev) =>
          prev.map((mediaItem) => {
            const resultIndex = results.findIndex(
              (_res, i) => imageBatch[i].scene === mediaItem.scene,
            );
            if (resultIndex === -1) return mediaItem;
            const result = results[resultIndex];
            if (result.status === "fulfilled") {
              return {
                ...mediaItem,
                status: "complete",
                url: result.value.url,
              };
            } else {
              const errorMessage =
                result.reason instanceof Error
                  ? result.reason.message
                  : "An unknown error occurred.";
              console.error(`Scene ${mediaItem.scene} failed:`, result.reason);
              return { ...mediaItem, status: "failed", error: errorMessage };
            }
          }),
        );

        if (getPending("image").length === 0) {
          setGenerationStage("VIDEO_BLOCK_2");
        }
        setIsQueueRunning(false);
        return;
      }

      // Process any remaining videos.
      if (currentStage === "VIDEO_BLOCK_2") {
        const pendingVideos = getPending("video");
        if (pendingVideos.length === 0) {
          setGenerationStage("DONE");
          setAppStatus(AppStatus.COMPLETE);
          setIsQueueRunning(false);
          return;
        }

        const videoBatch = pendingVideos.slice(0, 2);
        const modelToUse = VEO_MODELS[nextVideoModelIndex % VEO_MODELS.length];
        setGenerationStatusMessage(
          `Block 2: Generating ${videoBatch.length} video(s) with ${modelToUse}...`,
        );
        setLastBatchStart(Date.now());
        setGeneratedMedia((prev) =>
          prev.map((m) =>
            videoBatch.some((s) => s.scene === m.scene)
              ? { ...m, status: "generating" }
              : m,
          ),
        );

        const promises = videoBatch.map((s) =>
          generateVideoClip(s.prompt, aspectRatio, modelToUse).then(
            (result) => ({ scene: s, url: result.url }),
          ),
        );
        const results = await Promise.allSettled(promises);

        setGeneratedMedia((prev) =>
          prev.map((mediaItem) => {
            const resultIndex = results.findIndex(
              (_res, i) => videoBatch[i].scene === mediaItem.scene,
            );
            if (resultIndex === -1) return mediaItem;
            const result = results[resultIndex];
            if (result.status === "fulfilled") {
              return {
                ...mediaItem,
                status: "complete",
                url: result.value.url,
              };
            } else {
              const errorMessage =
                result.reason instanceof Error
                  ? result.reason.message
                  : "An unknown error occurred.";
              console.error(`Scene ${mediaItem.scene} failed:`, result.reason);
              return { ...mediaItem, status: "failed", error: errorMessage };
            }
          }),
        );

        setNextVideoModelIndex((prev) => prev + 1);
        setIsQueueRunning(false);
        return;
      }
    } catch (e: any) {
      console.error("A critical error occurred in the generation queue:", e);
      setError(
        "A critical error occurred. Please check the console and consider restarting.",
      );
      setGeneratedMedia((prev) =>
        prev.map((m) =>
          m.status === "generating" ? { ...m, status: "failed" } : m,
        ),
      );
    }

    setIsQueueRunning(false);
  }, [
    generatedMedia,
    storyboard,
    lastBatchStart,
    songDetails,
    generationStage,
    nextVideoModelIndex,
  ]);

  // Effect to trigger the queue manager whenever the state allows.
  useEffect(() => {
    if (appStatus === AppStatus.GENERATING_MEDIA && !isQueueRunning) {
      manageGenerationQueue();
    }
  }, [appStatus, isQueueRunning, generatedMedia, manageGenerationQueue]);

  /**
   * Triggers the `videoCombiner` service to assemble the final video.
   */
  const handleCombineMedia = useCallback(async () => {
    const completeMedia = generatedMedia.filter(
      (m) => m.status === "complete" && m.url,
    );
    if (!songDetails?.audioFile || completeMedia.length !== storyboard.length) {
      setError(
        "All media clips must be successfully generated before combining.",
      );
      return;
    }

    setIsCombining(true);
    setFinalVideoUrl(null);
    setError(null);

    try {
      const sortedMedia = completeMedia.sort((a, b) => a.scene - b.scene);

      const videoUrl = await combineMedia({
        media: sortedMedia as (GeneratedMedia & { url: string })[],
        audioFile: songDetails.audioFile,
        storyboard,
      });

      setFinalVideoUrl(videoUrl);
      // Add the final video to the gallery.
      if (songDetails) {
        onCreationComplete({
          type: "music-video",
          title: songDetails.title,
          artist: songDetails.artist,
          url: videoUrl,
        });
      }
    } catch (e: any) {
      console.error("Failed to combine media:", e);
      setError(e.message || "An error occurred while combining media.");
    } finally {
      setIsCombining(false);
    }
  }, [songDetails, generatedMedia, storyboard, onCreationComplete]);

  /**
   * Resets a specific scene to 'pending' to allow it to be regenerated.
   */
  const handleRegenerateScene = useCallback(
    (sceneNumber: number) => {
      if (finalVideoUrl) {
        URL.revokeObjectURL(finalVideoUrl);
        setFinalVideoUrl(null);
      }

      setGeneratedMedia((prev) => {
        const newMedia = [...prev];
        const index = newMedia.findIndex((m) => m.scene === sceneNumber);
        if (index !== -1) {
          if (newMedia[index].url) {
            URL.revokeObjectURL(newMedia[index].url!);
          }
          newMedia[index] = {
            ...newMedia[index],
            status: "pending",
            url: null,
            error: undefined,
          };
          setAppStatus(AppStatus.GENERATING_MEDIA);
          setGenerationStage("INITIAL");
          setNextVideoModelIndex(0);
        }
        return newMedia;
      });
    },
    [finalVideoUrl],
  );

  // Main render logic that switches between different screens based on the app status.
  const renderContent = () => {
    switch (appStatus) {
      case AppStatus.UPLOAD:
        return (
          <UploadScreen
            onSubmit={handleUploadSubmit}
            error={error}
            profile={profile}
            setProfile={setProfile}
            onBack={onBackToStudio}
          />
        );
      case AppStatus.GENERATING_STORYBOARD:
        return (
          <Loader message="Directing the vision... Analyzing audio and generating storyboard..." />
        );
      case AppStatus.GENERATING_MEDIA:
      case AppStatus.COMPLETE:
        return (
          <ProductionStudio
            songDetails={songDetails!}
            storyboard={storyboard}
            generatedMedia={generatedMedia}
            isGenerating={appStatus === AppStatus.GENERATING_MEDIA}
            generationStatusMessage={generationStatusMessage}
            isCombining={isCombining}
            finalVideoUrl={finalVideoUrl}
            onCombine={handleCombineMedia}
            onRegenerate={handleRegenerateScene}
          />
        );
      default:
        return <Loader />;
    }
  };

  return (
    <>
      <header className="flex justify-between items-start mb-12">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
            AI Music Video Generator
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Your Vision, Generated.
          </p>
        </div>
        <button
          onClick={onBackToStudio}
          className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
        >
          &larr; Back to Studio
        </button>
      </header>
      {renderContent()}
    </>
  );
};
