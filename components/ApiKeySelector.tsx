/**
 * @file This component renders a modal that prompts the user to select their Google AI Studio API key.
 * This is required for features that use pay-as-you-go models like Veo.
 * It uses the `window.aistudio.openSelectKey()` function provided by the hosting environment.
 */

import React, { useState } from "react";
import { SectionCard } from "./SectionCard";

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({
  onKeySelected,
}) => {
  // State to manage the button's disabled status to prevent multiple clicks.
  const [isOpening, setIsOpening] = useState(false);

  /**
   * Handles the button click to open the API key selection dialog.
   * After the dialog is closed, it calls the `onKeySelected` callback to notify the parent component.
   */
  const handleSelectKey = async () => {
    setIsOpening(true);
    try {
      // This is a special function provided by the AI Studio environment.
      await window.aistudio.openSelectKey();
      // Assume success and let the parent component re-check the key status.
      onKeySelected();
    } catch (e) {
      console.error("Error opening API key selection:", e);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <SectionCard className="max-w-lg w-full">
        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold font-display text-yellow-400 mb-4">
            API Key Required
          </h2>
          <p className="text-gray-300 mb-6">
            This application uses the Veo video generation model, which requires
            you to select your own Google AI Studio API key. Your key is used
            directly and is not stored by this application.
          </p>
          <button
            onClick={handleSelectKey}
            disabled={isOpening}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isOpening ? "Opening Dialog..." : "Select API Key"}
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Project setup and billing information can be found at{" "}
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-400"
            >
              ai.google.dev/gemini-api/docs/billing
            </a>
            .
          </p>
        </div>
      </SectionCard>
    </div>
  );
};
