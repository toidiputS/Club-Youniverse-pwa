/**
 * @file This service contains the client-side logic for combining multiple media sources
 * (videos, images) with an audio track into a single video file.
 * It uses the 'cline' tool, a high-performance video assembly engine, to perform the combination.
 */

import type { GeneratedMedia, StoryboardScene } from '../types';

// Define the expected interface for the 'cline' tool on the window object.
declare global {
    interface Window {
        cline?: {
            run: (params: {
                media: { type: 'video' | 'image'; url: string }[];
                audio: string;
                imageDurationMs: number;
                width: number;
                height: number;
            }) => Promise<{ url: string }>;
        }
    }
}


interface CombineMediaParams {
  media: (GeneratedMedia & { url: string })[];
  audioFile: File;
  storyboard: StoryboardScene[];
}

/**
 * Combines generated media clips and an audio file into a single video using the 'cline' tool.
 * This replaces the previous Canvas/MediaRecorder implementation with a more robust solution.
 * @param params - An object containing the media, audio file, and storyboard.
 * @returns A promise that resolves to a blob URL of the final combined video.
 */
export const combineMedia = ({ media, audioFile }: CombineMediaParams): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    // Check if the cline tool is available.
    if (!window.cline || typeof window.cline.run !== 'function') {
      return reject(new Error("The 'cline' video combination tool is not available. This may be a browser compatibility issue or the tool was not installed correctly."));
    }

    let audioObjectUrl: string | null = null;
    
    try {
      // Pre-load media elements to get their dimensions and durations.
      const videoElements = media
        .filter(m => m.type === 'video')
        .map(m => {
          const video = document.createElement('video');
          video.src = m.url;
          video.muted = true;
          video.preload = "auto";
          return video;
      });
      
      const imageElements = media
        .filter(m => m.type === 'image')
        .map(m => {
          const img = new Image();
          img.src = m.url;
          return img;
      });

      await Promise.all([
          ...videoElements.map(v => new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; v.load() })),
          ...imageElements.map(img => new Promise((res, rej) => { img.onload = res; img.onerror = rej; }))
      ]);

      // Load audio to get its duration.
      const audio = document.createElement('audio');
      audioObjectUrl = URL.createObjectURL(audioFile);
      audio.src = audioObjectUrl;
      await new Promise<void>((res, rej) => { audio.onloadedmetadata = () => res(); audio.onerror = rej; });

      // Calculate duration for each image.
      const totalVideoDuration = videoElements.reduce((acc, v) => acc + v.duration, 0);
      const audioDuration = audio.duration;
      const remainingForImages = Math.max(0, audioDuration - totalVideoDuration);
      const imageCount = imageElements.length;
      const imageDurationMs = imageCount > 0 ? (remainingForImages * 1000) / imageCount : 0;
      
      // Determine output dimensions.
      let width = 1280;
      let height = 720;
      if (videoElements.length > 0) {
        width = videoElements[0].videoWidth;
        height = videoElements[0].videoHeight;
      } else if (imageElements.length > 0) {
        width = imageElements[0].width;
        height = imageElements[0].height;
      }
      
      // Prepare the payload for the cline tool.
      const sortedMedia = media.sort((a, b) => a.scene - b.scene);
      const clineMedia = sortedMedia.map(m => ({
          type: m.type,
          url: m.url,
      }));

      // Execute the cline tool.
      console.log("Invoking cline video combination tool...");
      const result = await window.cline.run({
        media: clineMedia,
        audio: audioObjectUrl,
        imageDurationMs: imageDurationMs,
        width: width,
        height: height,
      });

      if (!result || !result.url) {
        throw new Error("The 'cline' tool finished but did not return a valid video URL.");
      }
      
      // Resolve with the blob URL from cline.
      resolve(result.url);

    } catch (e: any) {
      console.error("Error during 'cline' video combination:", e);
      reject(new Error(`Video combination failed: ${e.message}`));
    } finally {
      // Clean up the object URL created for the audio file.
      if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
      }
    }
  });
};