/**
 * @file audioUtils.ts - Utility functions for audio processing and metadata extraction.
 */

/**
 * Detects the duration of an audio file in seconds.
 *
 * @param file - The audio file to analyze.
 * @returns A promise that resolves with the duration in seconds.
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    // Create an object URL for the file to load it into the Audio element
    const objectUrl = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      // Success: Metadata loaded, we have the duration
      const duration = audio.duration;
      URL.revokeObjectURL(objectUrl);

      // Basic validation: duration should be a finite number greater than 0
      if (isFinite(duration) && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error("Invalid audio duration detected."));
      }
    };

    audio.onerror = () => {
      // Error handling
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Failed to load audio metadata. The file may be corrupt or an unsupported format.",
        ),
      );
    };

    // Set the source to start loading metadata
    audio.src = objectUrl;
  });
};
