/**
 * @file This file provides general-purpose services for interacting with the Google GenAI API.
 * It includes functions for generating storyboards, video clips, images, album covers, and speech.
 * These are the foundational AI generation capabilities for the application's creative features.
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SongDetails, StoryboardScene } from "../types";

/**
 * Helper function to decode a base64 string into an ArrayBuffer.
 * This is used for processing image and video data returned from the API.
 * @param base64 - The base64 encoded string.
 * @returns An ArrayBuffer containing the decoded binary data.
 */
const decodeBase64 = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Helper to safely get the API key from various environment sources.
 * It checks import.meta.env (Vite) and process.env (Standard/Injected).
 */
const getApiKey = (): string | undefined => {
  const viteEnv = import.meta.env || ({} as any);
  return (
    viteEnv.VITE_API_KEY ||
    (typeof process !== "undefined" && process.env && process.env.API_KEY)
  );
};

/**
 * Creates a new GoogleGenAI client instance.
 * A new client is created for each request to ensure the latest API key from `process.env` is used,
 * which is critical for features that allow users to select their API key at runtime.
 * @returns A new instance of the GoogleGenAI client.
 * @throws An error if the API_KEY environment variable is not set.
 */
const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "API_KEY environment variable not set. Please select or provide an API key.",
    );
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes song details and generates a structured storyboard using a powerful text model (Gemini 2.5 Pro).
 * It dynamically calculates the number of scenes based on the desired pacing.
 * @param songDetails - The details of the song including title, artist, lyrics, style, and pacing.
 * @param audioDuration - The duration of the audio file in seconds.
 * @returns A promise that resolves to an array of StoryboardScene objects.
 * @throws An error if storyboard generation fails or the API key is invalid.
 */
export const analyzeSongAndGenerateStoryboard = async (
  songDetails: SongDetails,
  audioDuration: number,
): Promise<StoryboardScene[]> => {
  const ai = getAiClient();
  const { title, artist, lyrics, styleKeywords, pacing } = songDetails;
  const numberOfScenes =
    pacing === "slow"
      ? Math.max(1, Math.floor(audioDuration / 15))
      : pacing === "fast"
        ? Math.floor(audioDuration / 5)
        : Math.floor(audioDuration / 10);

  const prompt = `
    You are a creative music video director. Analyze the provided song details to create a compelling storyboard.

    Song Title: ${title}
    Artist: ${artist}
    Lyrics:
    ${lyrics || "No lyrics provided. Focus on the song title, artist, and style keywords."}

    Style Keywords: ${styleKeywords}
    Target Music Video Duration: ${Math.round(audioDuration)} seconds.
    Pacing: ${pacing} (This means you should generate roughly ${numberOfScenes} scenes).

    Your task is to generate a storyboard as a JSON array of scenes. Each scene must be an object with the following properties:
    - "scene": A unique sequential number, starting from 1.
    - "type": The type of media to generate. Use "video" for dynamic scenes and "image" for static or transitional shots. Use a mix of both. Aim for about 70% video and 30% image.
    - "description": A brief, one-sentence description of the scene's visual content and mood, as if you were describing it to the artist.
    - "prompt": A detailed, descriptive prompt for an AI generative model (like Veo or Imagen) to create the visual for this scene. This prompt should be rich in visual detail, incorporating the style keywords, mood, and lyrical themes. Be specific about subjects, actions, lighting, and camera angles.

    Generate exactly ${numberOfScenes} scenes. Ensure the output is a valid JSON array.
    `;

  // Define the expected JSON schema for the response to ensure structured output.
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        scene: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ["video", "image"] },
        description: { type: Type.STRING },
        prompt: { type: Type.STRING },
      },
      required: ["scene", "type", "description", "prompt"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a powerful model for creative tasks.
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const storyboard = JSON.parse(jsonText) as StoryboardScene[];
    // Validate and re-number scenes to ensure they are sequential from 1.
    return storyboard.map((scene, index) => ({ ...scene, scene: index + 1 }));
  } catch (e: any) {
    console.error("Error generating storyboard:", e);
    if (e.message?.includes("API key not valid")) {
      throw new Error(
        "The selected API key is not valid. Please select a different key.",
      );
    }
    throw new Error(
      "Failed to generate storyboard from AI. The model may have returned an invalid format or an error occurred.",
    );
  }
};

/**
 * Generates a video clip from a text prompt using a Veo model.
 * It polls the generation operation until it's complete and then fetches the video data.
 * @param prompt - The detailed text prompt for the video.
 * @param aspectRatio - The desired aspect ratio for the video ('16:9', '9:16', etc.).
 * @param model - The specific Veo model to use for generation (e.g., 'veo-3.1-fast-generate-preview').
 * @returns A promise that resolves to an object containing the blob URL of the generated video.
 * @throws An error if video generation or download fails.
 */
export const generateVideoClip = async (
  prompt: string,
  aspectRatio: SongDetails["aspectRatio"],
  model: string,
): Promise<{ url: string }> => {
  const ai = getAiClient();
  try {
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: aspectRatio,
      },
    });

    // Poll the operation status every 10 seconds until it's done.
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error(
        "Video generation completed but no download link was found.",
      );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(
        "API key is missing when trying to fetch generated video.",
      );
    }
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Video download failed with status:",
        response.status,
        " and message:",
        errorText,
      );
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    return { url: videoUrl };
  } catch (e: any) {
    console.error("Error generating video clip:", e);
    if (e.message?.includes("API key not valid")) {
      throw new Error(
        "The selected API key is not valid. Please select a different key.",
      );
    }
    if (e.message?.includes("Requested entity was not found")) {
      throw new Error(
        "The selected API key is not valid for Veo or project setup is incomplete. Please select a different key and check your billing setup.",
      );
    }
    throw new Error("Failed to generate video clip from AI.");
  }
};

/**
 * Generates an image from a text prompt using an Imagen model.
 * @param prompt - The detailed text prompt for the image.
 * @param aspectRatio - The desired aspect ratio for the image ('16:9', '1:1', etc.).
 * @returns A promise that resolves to an object containing the blob URL of the generated image.
 * @throws An error if image generation fails.
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: SongDetails["aspectRatio"],
): Promise<{ url: string }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: aspectRatio,
      },
    });

    const base64ImageBytes: string =
      response.generatedImages[0].image.imageBytes;
    const imageBuffer = decodeBase64(base64ImageBytes);
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    const imageUrl = URL.createObjectURL(imageBlob);
    return { url: imageUrl };
  } catch (e: any) {
    console.error("Error generating image:", e);
    if (e.message?.includes("API key not valid")) {
      throw new Error(
        "The selected API key is not valid. Please select a different key.",
      );
    }
    throw new Error("Failed to generate image from AI.");
  }
};

/**
 * Generates a square album cover image from a text prompt.
 * This is a specialized version of `generateImage` for 1:1 aspect ratio.
 * @param prompt - The detailed text prompt for the album cover.
 * @returns A promise that resolves to an object containing the blob URL of the generated image.
 * @throws An error if image generation fails.
 */
export const generateAlbumCover = async (
  prompt: string,
): Promise<{ url: string }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1", // Album covers are always square
      },
    });

    const base64ImageBytes: string =
      response.generatedImages[0].image.imageBytes;
    const imageBuffer = decodeBase64(base64ImageBytes);
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    const imageUrl = URL.createObjectURL(imageBlob);
    return { url: imageUrl };
  } catch (e: any) {
    console.error("Error generating album cover:", e);
    if (e.message?.includes("API key not valid")) {
      throw new Error(
        "The selected API key is not valid. Please select a different key.",
      );
    }
    throw new Error("Failed to generate album cover from AI.");
  }
};

/**
 * Generates speech audio from a text script using a TTS model.
 * @param script - The text to be converted to speech.
 * @param voiceName - The name of the pre-built voice to use (e.g., 'Kore', 'Fenrir').
 * @returns A promise that resolves to a base64 encoded string of the raw audio data.
 * @throws An error if speech generation fails.
 */
export const generateSpeech = async (
  script: string,
  voiceName: string,
): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });
    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from TTS API.");
    }
    return base64Audio;
  } catch (e: any) {
    console.error("Error generating speech:", e);
    if (
      e.message?.includes("API key not valid") ||
      e.message?.includes("403")
    ) {
      throw new Error(
        "The selected API key is not valid for TTS or has been disabled. Please select a different key.",
      );
    }
    // Specific check for rate-limiting (429 Too Many Requests)
    if (
      e.message?.includes("429") ||
      e.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error(
        "TTS API rate limit exceeded. Please wait a moment before trying again. (429)",
      );
    }
    throw new Error("Failed to generate speech from AI.");
  }
};
