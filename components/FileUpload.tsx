/**
 * @file This component provides a styled drag-and-drop file upload area.
 * It's used for uploading audio files in the music video generator and song submission forms.
 */

import React, { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  // State to hold the name of the selected file for display.
  const [fileName, setFileName] = useState<string | null>(null);

  /**
   * Handles the file selection event from the input element.
   * Updates the local state with the file name and calls the `onFileSelect` prop.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    } else {
      setFileName(null);
      onFileSelect(null);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="audio-upload"
        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
          </svg>
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold text-yellow-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">MP3, WAV, or other audio formats</p>
        </div>
        <input id="audio-upload" type="file" className="hidden" onChange={handleFileChange} accept="audio/*" />
      </label>
      {/* Display the name of the uploaded file */}
      {fileName && <p className="text-sm text-center mt-2 text-green-400">Uploaded: {fileName}</p>}
    </div>
  );
};