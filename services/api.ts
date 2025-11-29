/**
 * @file This file documents the service boundaries (API contract) for Club Youniverse Live.
 * It provides placeholder/mock functions for frontend development that correspond to the
 * defined HTTP endpoints and WebSocket topics that a real backend would provide.
 */

import type { User, Song, BoxRound, DJEvent } from '../types';

// --- Base URL for the API ---
// This would be configured in an environment variable in a real application.
const API_BASE_URL = '/api/v1';


// --- HTTP API Endpoints ---

/**
 * GET /box/current
 * Fetches the three current candidate songs in "The Box".
 * @returns {Promise<BoxRound>} The current box round with song details.
 */
export async function getCurrentBox(): Promise<BoxRound> {
    console.log('API Call: GET /box/current');
    // Real implementation:
    // const response = await fetch(`${API_BASE_URL}/box/current`);
    // if (!response.ok) throw new Error('Failed to fetch current box.');
    // return response.json();
    
    // MOCK IMPLEMENTATION: Return mock data after a short delay.
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockBoxRound: BoxRound = {
        id: `round-initial-empty`,
        candidates: [],
        startedAt: new Date().toISOString(),
    };
    return Promise.resolve(mockBoxRound);
}

/**
 * POST /box/vote
 * Submits a user's vote for a song in the current round.
 * @param {{ roundId: string, songId: string }} vote - The vote details.
 * @returns {Promise<void>}
 */
export async function castVote(vote: { roundId: string, songId: string }): Promise<void> {
    console.log('API Call: POST /box/vote', vote);
    // Real implementation:
    // const response = await fetch(`${API_BASE_URL}/box/vote`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(vote),
    // });
    // if (!response.ok) throw new Error('Failed to cast vote.');

    // MOCK IMPLEMENTATION: Simulate a quick API call.
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Vote cast for ${vote.songId} in round ${vote.roundId}`);
    return Promise.resolve();
}

/**
 * GET /now-playing
 * Gets the currently playing song and its progress.
 * @returns {Promise<{ song: Song, elapsedSeconds: number }>}
 */
export async function getNowPlaying(): Promise<{ song: Song, elapsedSeconds: number }> {
    console.log('API Call: GET /now-playing');
    // Real implementation:
    // const response = await fetch(`${API_BASE_URL}/now-playing`);
    // if (!response.ok) throw new Error('Failed to get now playing song.');
    // return response.json();
    throw new Error("Server-side API not implemented.");
}

/**
 * GET /leaderboard
 * Fetches a paginated list of top-rated songs.
 * @param {{ sortBy: 'stars' | 'playCount', page: number, limit: number }} params - Query parameters.
 * @returns {Promise<Song[]>} A list of songs.
 */
export async function getLeaderboard(params: { sortBy: 'stars' | 'playCount', page: number, limit: number }): Promise<Song[]> {
    console.log('API Call: GET /leaderboard', params);
    // Real implementation:
    // const query = new URLSearchParams(params as any).toString();
    // const response = await fetch(`${API_BASE_URL}/leaderboard?${query}`);
    // if (!response.ok) throw new Error('Failed to fetch leaderboard.');
    // return response.json();

    // MOCK IMPLEMENTATION: Return an empty array now that data comes from props.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return Promise.resolve([]);
}

/**
 * GET /graveyard
 * Fetches a list of songs that have reached zero stars.
 * @returns {Promise<Song[]>} A list of songs.
 */
export async function getGraveyardSongs(): Promise<Song[]> {
    console.log('API Call: GET /graveyard');
    // Real implementation:
    // const response = await fetch(`${API_BASE_URL}/graveyard`);
    // if (!response.ok) throw new Error('Failed to fetch graveyard.');
    // return response.json();
    
    // MOCK IMPLEMENTATION: Return an empty array now that data comes from props.
    await new Promise(resolve => setTimeout(resolve, 500));
    return Promise.resolve([]);
}


/**
 * POST /dj/event
 * Schedules a new DJ event (e.g., an ad read or promo). Requires moderator privileges.
 * @param {Partial<DJEvent>} eventData - The data for the DJ event.
 * @returns {Promise<DJEvent>} The created DJ event.
 */
export async function scheduleDjEvent(eventData: Partial<DJEvent>): Promise<DJEvent> {
    console.log('API Call: POST /dj/event', eventData);
    // Real implementation:
    // const response = await fetch(`${API_BASE_URL}/dj/event`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_MOD_TOKEN' },
    //   body: JSON.stringify(eventData),
    // });
    // if (!response.ok) throw new Error('Failed to schedule DJ event.');
    // return response.json();
    throw new Error("Server-side API not implemented.");
}


// --- WebSocket Topics ---

/**
 * Manages the WebSocket connection for real-time updates from the server.
 * In a real application, this would be a class or a set of functions that:
 * 1. Establishes a WebSocket connection.
 * 2. Handles authentication.
 * 3. Subscribes to topics.
 * 4. Dispatches events for the UI to listen to.
 * 5. Manages reconnection logic.
 */
export function connectToWebSocket(eventHandlers: {
    onNowPlaying: (data: { songId: string, startedAt: string }) => void;
    onBoxRound: (data: { roundId: string, candidates: Song[] }) => void;
    onBoxWinner: (data: { roundId: string, winnerSongId: string }) => void;
    onDjCue: (data: { script: string }) => void;
    onError: (error: Error) => void;
    onClose: () => void;
}) {
    console.log('Attempting to connect to WebSocket...');
    // A real WebSocket implementation would look like this:
    // const socket = new WebSocket('wss://your-api-domain.com/ws');
    
    // socket.onopen = () => console.log('WebSocket connected.');
    // socket.onerror = (err) => eventHandlers.onError(new Error('WebSocket error.'));
    // socket.onclose = () => eventHandlers.onClose();

    // socket.onmessage = (event) => {
    //   const { topic, payload } = JSON.parse(event.data);
    //   switch (topic) {
    //     case 'nowPlaying':
    //       eventHandlers.onNowPlaying(payload);
    //       break;
    //     // ... other cases
    //   }
    // };
    throw new Error("Server-side WebSocket not implemented.");
}

/**
 * @websocket_topic nowPlaying
 * @payload { songId: string, startedAt: string }
 * @description Sent when a new song begins playing live on the radio.
 */

/**
 * @websocket_topic boxRound
 * @payload { roundId: string, candidates: Song[] }
 * @description Sent when a new round of "The Box" begins, providing the new candidates.
 */

/**
 * @websocket_topic boxWinner
 * @payload { roundId: string, winnerSongId: string }
 * @description Sent immediately after a vote concludes, announcing the winner.
 */

/**
 * @websocket_topic djCue
 * @payload { script: string }
 * @description Sent to cue the next piece of DJ banter or a scheduled event for TTS generation.
 */