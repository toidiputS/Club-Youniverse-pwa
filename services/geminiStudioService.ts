/**
 * @file This file provides specialized services for interacting with the Gemini API
 * using specific function-calling tools defined for Club Youniverse studio operations.
 * This abstracts the complex prompting and tool configuration required for the app's core AI logic.
 */

import {
  GoogleGenAI,
  Type,
  FunctionDeclaration,
  GenerateContentConfig,
} from "@google/genai";
import { getRandomPremiumCalloutUrl } from "./supabaseStorageService";
import { getBankLine } from "./djLineBank";
import type {
  SelectBoxCandidatesInput,
  SelectBoxCandidatesOutput,
  DjBanterScriptInput,
  DjBanterScriptOutput,
  ZeroStarCallCopyInput,
  ZeroStarCallCopyOutput,
  LyricsDetectAndCleanInput,
  LyricsDetectAndCleanOutput,
  CoverLayoutPlanInput,
  CoverLayoutPlanOutput,
  VideoStylePlanInput,
  VideoStylePlanOutput,
  WeirdNewsOutput,
  DjQueueItem,
} from "../types";

/**
 * Helper to get all available API keys from environment
 */
const getAllApiKeys = (): string[] => {
  const viteEnv = import.meta.env || ({} as any);
  const keys: string[] = [];

  // Collect all VITE_API_KEY, VITE_API_KEY_2, VITE_API_KEY_3, etc.
  if (viteEnv.VITE_API_KEY) keys.push(viteEnv.VITE_API_KEY);
  if (viteEnv.VITE_API_KEY_2) keys.push(viteEnv.VITE_API_KEY_2);
  if (viteEnv.VITE_API_KEY_3) keys.push(viteEnv.VITE_API_KEY_3);
  if (viteEnv.VITE_API_KEY_4) keys.push(viteEnv.VITE_API_KEY_4);
  if (viteEnv.VITE_API_KEY_5) keys.push(viteEnv.VITE_API_KEY_5);

  return keys;
};

let currentKeyIndex = 0;

/**
 * Gets the next API key in rotation
 */
const getNextApiKey = (): string => {
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    throw new Error(
      "No API keys available. Please add VITE_API_KEY to .env.local",
    );
  }

  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};

/**
 * Creates a new GoogleGenAI client instance with automatic key rotation on 429 errors.
 */
const getAiClient = () => {
  const apiKey = getNextApiKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * Creates the base model configuration for a Gemini Studio service call.
 * The system instruction is dynamically inserted based on the current DJ's personality.
 * @param systemInstruction - The specific personality prompt for the current DJ.
 * @returns A Gemini model configuration object.
 */
const getModelConfig = (systemInstruction: string): GenerateContentConfig => ({
  systemInstruction,
  temperature: 0.7, // Slightly more creative for banter
  topP: 0.9,
  topK: 30,
});

// ----------------- Tool Declarations -----------------
// These are the definitions of the "functions" that the Gemini model can call.
// The model will return a structured JSON object matching these schemas.

const selectBoxCandidatesTool: FunctionDeclaration = {
  name: "select_box_candidates",
  description:
    "Given a pool of songs, select three candidates with weighted randomness and novelty.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      candidateIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "The IDs of the selected candidate songs.",
      },
      reason: {
        type: Type.STRING,
        description: "A brief justification for the selection.",
      },
    },
    required: ["candidateIds", "reason"],
  },
};

const djBanterScriptTool: FunctionDeclaration = {
  name: "dj_banter_script",
  description: "Generate lively DJ lines tailored to a specific event.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      script: {
        type: Type.STRING,
        description: "Clean, on-air friendly lines for the DJ.",
      },
      cta: {
        type: Type.STRING,
        description:
          "An optional call-to-action for voting or premium features.",
      },
      safety: {
        type: Type.OBJECT,
        properties: {
          profanity: { type: Type.BOOLEAN },
          defamation: { type: Type.BOOLEAN },
        },
        required: ["profanity", "defamation"],
      },
    },
    required: ["script", "safety"],
  },
};

const zeroStarCallCopyTool: FunctionDeclaration = {
  name: "zero_star_call_copy",
  description: "Generate a phone/text script for the 'zero star song' moment.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      callScript: { type: Type.STRING },
      smsCopy: { type: Type.STRING },
    },
    required: ["callScript", "smsCopy"],
  },
};

const lyricsDetectAndCleanTool: FunctionDeclaration = {
  name: "lyrics_detect_and_clean",
  description: "Auto-detect language or clean uploaded lyrics for a fold-out.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      cleanLyrics: { type: Type.STRING },
      detectedLanguage: { type: Type.STRING },
    },
    required: ["cleanLyrics", "detectedLanguage"],
  },
};

const coverLayoutPlanTool: FunctionDeclaration = {
  name: "cover_layout_plan",
  description: "Design spec for album art and an inside lyrics fold-out.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      front: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          safe: { type: Type.BOOLEAN },
        },
        required: ["prompt", "safe"],
      },
      back: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          safe: { type: Type.BOOLEAN },
        },
        required: ["prompt", "safe"],
      },
      spine: {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING } },
        required: ["text"],
      },
      inside: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            panel: { type: Type.STRING, enum: ["left", "center", "right"] },
            prompt: { type: Type.STRING },
            lyricsLayout: { type: Type.STRING, enum: ["two_column"] },
            title: { type: Type.STRING },
            credits: { type: Type.STRING },
          },
          required: ["panel"],
        },
      },
      export: {
        type: Type.OBJECT,
        properties: {
          sizes: { type: Type.ARRAY, items: { type: Type.STRING } },
          pdfBooklet: { type: Type.BOOLEAN },
        },
        required: ["sizes", "pdfBooklet"],
      },
    },
    required: ["front", "back", "spine", "inside", "export"],
  },
};

const videoStylePlanTool: FunctionDeclaration = {
  name: "video_style_plan",
  description:
    "Plan a music video from the song's mood/tempo; feeds your existing generator.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tStart: { type: Type.NUMBER },
            tEnd: { type: Type.NUMBER },
            prompt: { type: Type.STRING },
          },
          required: ["tStart", "tEnd", "prompt"],
        },
      },
      captions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            t: { type: Type.NUMBER },
            text: { type: Type.STRING },
          },
          required: ["t", "text"],
        },
      },
    },
    required: ["scenes"],
  },
};

// ----------------- Service Functions -----------------

/**
 * Fetches a weird news story using Gemini with Google Search grounding.
 * @returns A promise that resolves to a structured WeirdNewsOutput object.
 */
export const getWeirdNews = async (): Promise<WeirdNewsOutput> => {
  const ai = getAiClient();
  const prompt = `
    Find a recent, funny, and strange news story from the past week.
    Format your response exactly like this, with no extra text:
    HEADLINE: [Your catchy headline here]
    SUMMARY: [Your one or two sentence summary here]
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable Google Search grounding.
    },
  });

  const text = response.text || "";
  // Parse the structured text response.
  const headlineMatch = text.match(/HEADLINE: (.*)/);
  const summaryMatch = text.match(/SUMMARY: (.*)/);

  if (!headlineMatch || !summaryMatch) {
    console.error("Unexpected news format from Gemini:", text);
    throw new Error("Failed to parse weird news from Gemini response.");
  }

  const headline = headlineMatch[1].trim();
  const summary = summaryMatch[1].trim();

  // Extract source URLs from the grounding metadata, as required by API guidelines.
  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map((chunk) => chunk.web)
    .filter(
      (web): web is { uri: string; title: string } =>
        !!(web && web.uri && web.title),
    )
    .map((web) => ({ title: web.title, uri: web.uri }));

  return { headline, summary, sources };
};

/**
 * Asks Gemini to select three candidate songs for "The Box".
 * @param input - The current song pool and songs to avoid.
 * @returns A promise that resolves to the output of the 'select_box_candidates' function call.
 */
export const selectBoxCandidates = async (
  input: SelectBoxCandidatesInput,
): Promise<SelectBoxCandidatesOutput> => {
  const ai = getAiClient();
  const prompt = `
        Given the current pool and recent history, propose three candidates with a sentence of justification. Ensure variety: star tiers, moods, and new uploads. Use the select_box_candidates tool to return the result.

        Current Pool: ${JSON.stringify(input.pool, null, 2)}
        Avoid These IDs (recent winners): ${JSON.stringify(input.avoidIds)}
        Number of candidates to select: ${input.count}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      ...getModelConfig(
        "You are the station's music director, an impartial AI responsible for selecting songs for The Box based on data, not preference.",
      ),
      tools: [{ functionDeclarations: [selectBoxCandidatesTool] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "select_box_candidates") {
    return call.args as unknown as SelectBoxCandidatesOutput;
  }

  throw new Error(
    "Gemini did not return the expected function call for select_box_candidates.",
  );
};

/**
 * Generates a prompt for a specific DJ banter event based on the new philosophy.
 * @param input - The event type and context.
 * @returns A string prompt for the Gemini model.
 */
const getBanterPrompt = (input: DjBanterScriptInput): string => {
  const { event, song, context } = input;

  switch (event) {
    case "new_artist_shoutout":
      return `A new artist, ${song?.artistName}, has stepped into the arena with their debut track "${song?.title}". This is a massive moment. Generate a short, epic, on-air shout-out celebrating the courage it takes to share one's art with the world. Frame it as them stepping up to be judged by the Youniverse. Keep it to one or two powerful sentences.`;

    case "debut_song_outro":
      const isSuccess = (song?.finalRating ?? 0) >= 5;
      const ratingText = (song?.finalRating ?? 0).toFixed(1);
      if (isSuccess) {
        return `The Trial by Fire is complete. The debut track "${song?.title}" by ${song?.artistName} has been judged. The Youniverse has spoken, and it debuts with a final rating of ${ratingText} stars. Announce this success. The track has survived and now enters the pool to fight for its place.`;
      } else {
        return `The Trial by Fire is complete. The debut track "${song?.title}" by ${song?.artistName} has been judged. The Youniverse has spoken, and its debut rating is ${ratingText} stars. This is below the threshold for survival. Announce that the song is being honorably retired to the Graveyard. Commend the artist's courage and inform them they have 24 hours to attempt a second Trial by Fire. Your tone should be respectful but brutally honest.`;
      }

    case "graveyard_roast":
      return `The song "${song?.title}" by ${song?.artistName} just hit zero stars and is heading to the Graveyard. Deliver a short, final sign-off. The tone isn't a roast, but a respectful, impartial acknowledgment that it failed to connect with the audience. Something like a final data report. "The data is in," or "The Youniverse has rendered its final verdict."`;

    default:
      return `
                Write a very short, 5-15 second DJ script for the given event, embodying your current persona. You are an impartial AI who just states the facts based on listener data. One memorable line, one CTA. If the event is 'user_mention', respond directly to the user's message in your on-air style. For 'dj_shift_change', announce who is taking over. Use the dj_banter_script tool to return the result.

                Event Details:
                ${JSON.stringify({ event, song, context }, null, 2)}
            `;
  }
};

/**
 * Asks Gemini to generate a DJ script for a specific radio event, or fetches a pre-recorded line.
 * @param input - The event type and any relevant context (e.g., song details, dj profile).
 * @returns A promise that resolves to a DjQueueItem for playback, or null.
 */
export const generateDjBanter = async (
  input: DjBanterScriptInput,
): Promise<DjQueueItem | null> => {
  // Handle the new premium CTA event separately.
  if (input.event === "premium_cta") {
    const url = await getRandomPremiumCalloutUrl();
    if (url) {
      return {
        id: `dj-url-${Date.now()}`,
        type: "url",
        content: url,
      };
    }
    // If no URL is found, we can just return null and nothing will be played.
    return null;
  }

  // Ensure a DJ profile is provided for script generation.
  if (!input.djProfile) {
    console.error("Cannot generate banter without a DJ profile.");
    return null;
  }

  const ai = getAiClient();
  const { djProfile } = input;

  // HYBRID LOGIC:
  // 1. Certain events ALWAYS use the bank to save $ (intro, outro, filler, etc.)
  // 2. Others use a mix (70% bank, 30% AI for freshness)
  // 3. Complex events like user_mention ALWAYS use AI.

  const highCostEvents = [
    "intro",
    "outro",
    "new_box_round",
    "filler",
    "empty_queue_banter",
    "winner_announcement",
    "graveyard_roast",
    "new_artist_shoutout",
    "debut_song_outro",
    "system_explainer",
  ];
  const weight = Math.random();
  const shouldKeepItStatic =
    highCostEvents.includes(input.event) && weight < 0.8; // 80% use bank for these

  if (shouldKeepItStatic && input.event !== "user_mention") {
    const bankLine = getBankLine(input);
    if (bankLine) {
      console.log(`🏦 [Line Bank] Event: ${input.event}`);
      return {
        id: `dj-bank-${Date.now()}`,
        type: "tts",
        content: bankLine,
        djName: djProfile.name,
      };
    }
  }

  const prompt = getBanterPrompt(input); // Use the new prompt generator

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        ...getModelConfig(djProfile.personality), // Use the dynamic personality for the system prompt.
        tools: [{ functionDeclarations: [djBanterScriptTool] }],
      },
    });

    const call = response.functionCalls?.[0];
    if (call?.name === "dj_banter_script" && call.args?.script) {
      // This is the output from Gemini, we wrap it in our queue item type.
      return {
        id: `dj-tts-${Date.now()}`,
        type: "tts",
        content: (call.args as unknown as DjBanterScriptOutput).script,
        djName: djProfile.name, // Tag the script with the DJ who said it.
      };
    }

    console.warn(
      "Gemini did not return the expected function call for dj_banter_script for event:",
      input.event,
    );

    // FALLBACK: If Gemini fails to return a script, use the bank as a safety net.
    const fallbackLine = getBankLine(input);
    if (fallbackLine) {
      return {
        id: `dj-fallback-${Date.now()}`,
        type: "tts",
        content: fallbackLine,
        djName: djProfile.name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini for DJ banter:", error);

    // CRITICAL FALLBACK: If API error (429, etc.), use the bank.
    const fallbackLine = getBankLine(input);
    if (fallbackLine) {
      console.log("🚑 [Critical Fallback] Using Line Bank due to AI error");
      return {
        id: `dj-fallback-${Date.now()}`,
        type: "tts",
        content: fallbackLine,
        djName: djProfile.name,
      };
    }

    throw error; // Re-throw if even the bank fails (unlikely)
  }
};

/**
 * Asks Gemini to generate scripts for the "zero star song" event.
 * @param input - The artist and song title.
 * @returns A promise that resolves to the call and SMS scripts.
 */
export const generateZeroStarCallCopy = async (
  input: ZeroStarCallCopyInput,
): Promise<ZeroStarCallCopyOutput> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `Generate a funny but gentle roast script for a song that hit zero stars. The artist is ${input.artistName} and the song is "${input.songTitle}". Tone should be ${input.tone}. Use the zero_star_call_copy tool to return the result.`,
    config: {
      ...getModelConfig("You are a witty radio producer writing copy."),
      tools: [{ functionDeclarations: [zeroStarCallCopyTool] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "zero_star_call_copy") {
    return call.args as unknown as ZeroStarCallCopyOutput;
  }

  throw new Error(
    "Gemini did not return the expected function call for zero_star_call_copy.",
  );
};

// The remaining functions follow the same pattern:
// 1. Define a prompt with context.
// 2. Call the Gemini model with the corresponding tool.
// 3. Check for the expected function call in the response.
// 4. Return the structured arguments from the function call.

export const cleanLyrics = async (
  input: LyricsDetectAndCleanInput,
): Promise<LyricsDetectAndCleanOutput> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `Analyze the following text, clean up any formatting issues, and identify the language: ${input.rawLyrics.substring(0, 500)}... Use the lyrics_detect_and_clean tool to return the result.`,
    config: {
      ...getModelConfig("You are a helpful text-processing assistant."),
      tools: [{ functionDeclarations: [lyricsDetectAndCleanTool] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "lyrics_detect_and_clean") {
    return call.args as unknown as LyricsDetectAndCleanOutput;
  }

  throw new Error(
    "Gemini did not return the expected function call for lyrics_detect_and_clean.",
  );
};

export const generateCoverLayoutPlan = async (
  input: CoverLayoutPlanInput,
): Promise<CoverLayoutPlanOutput> => {
  const ai = getAiClient();
  const prompt = `
        Create layout instructions for a gatefold by default. Inside center panel is lyrics; left panel shows a recurring visual motif from the front cover; right panel shows credits and QR for download. Ensure text safe margins (6mm). Prepare export sizes for square cover (3000×3000) and booklet PDF (A4 spreads). Use the cover_layout_plan tool to return the result.
        
        Song Details:
        ${JSON.stringify(input, null, 2)}
    `;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      ...getModelConfig("You are a creative art director for a record label."),
      tools: [{ functionDeclarations: [coverLayoutPlanTool] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "cover_layout_plan") {
    return call.args as unknown as CoverLayoutPlanOutput;
  }

  throw new Error(
    "Gemini did not return the expected function call for cover_layout_plan.",
  );
};

export const generateVideoStylePlan = async (
  input: VideoStylePlanInput,
): Promise<VideoStylePlanOutput> => {
  const ai = getAiClient();
  const prompt = `
        Split the song into scenes by musical phrases. Each scene has a visual prompt, camera motion, and transition style. Keep prompts concise so the downstream generator doesn’t choke. Use the video_style_plan tool to return the result.

        Song Details:
        ${JSON.stringify(input, null, 2)}
    `;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      ...getModelConfig("You are a music video director planning a shoot."),
      tools: [{ functionDeclarations: [videoStylePlanTool] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "video_style_plan") {
    return call.args as unknown as VideoStylePlanOutput;
  }

  throw new Error(
    "Gemini did not return the expected function call for video_style_plan.",
  );
};
