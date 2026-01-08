/**
 * @file LocalAiService.ts - Bridge to your self-hosted LM Studio (Gemma-3-1b)
 */

import { Song } from "../types";

const LM_STUDIO_URL = "http://172.20.20.20:1234/v1/chat/completions";

export class LocalAiService {
    /**
     * Generate a quick DJ banter line based on the transition.
     */
    static async generateDJSpeech(winner: Song, losers: Song[]): Promise<string> {
        const prompt = `You are a high-energy, slightly edgy AI DJ for "Club Youniverse". 
        The song "${winner.title}" by ${winner.artistName} just won the vote.
        It beat out ${losers.map(l => `"${l.title}"`).join(", ")}.
        Write a ONE SENTENCE announcement for the listeners. 
        Be cool, mysterious, and hype up the winner.`;

        try {
            const response = await fetch(LM_STUDIO_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "gemma-3-1b-it.gguf",
                    messages: [
                        { role: "system", content: "You are a professional radio DJ." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 60
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || `The crowd has spoken! Up next: ${winner.title}.`;
        } catch (e) {
            console.warn("🤖 Local AI unavailable, falling back to basic banter.", e);
            return `The crowd has spoken! Up next: ${winner.title} by ${winner.artistName}.`;
        }
    }

    /**
     * Generate a short roast for the chat.
     */
    static async generateRoast(song: Song): Promise<string> {
        try {
            const response = await fetch(LM_STUDIO_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "gemma-3-1b-it.gguf",
                    messages: [
                        { role: "system", content: "You are a witty, sarcastic AI bot in a club chat." },
                        { role: "user", content: `Write a very short, funny one-line roast for the song "${song.title}" by ${song.artistName}.` }
                    ],
                    temperature: 0.9,
                    max_tokens: 40
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "This track is... certainly something.";
        } catch (e) {
            return "This track is hitting different right now.";
        }
    }
}
