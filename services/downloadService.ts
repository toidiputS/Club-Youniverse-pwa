/**
 * @file Download Service - Utility for handling song downloads
 */
import { Song } from '../types';

/**
 * Triggers a browser download of a song's audio file.
 * @param song The song object to download.
 */
export const downloadSong = async (song: Song) => {
    if (!song.audioUrl) {
        console.error('❌ Cannot download song: Missing audio URL');
        return;
    }

    try {
        console.log(`📥 Downloading: ${song.title} by ${song.artistName}`);

        // Use the modern "download" attribute approach
        const a = document.createElement('a');
        a.href = song.audioUrl;

        // Sanitize filename
        const filename = `${song.artistName} - ${song.title}`.replace(/[<>:"/\\|?*]/g, '_');
        a.download = `${filename}.mp3`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log('✅ Download triggered');
    } catch (error) {
        console.error('❌ Download failed:', error);
    }
};
