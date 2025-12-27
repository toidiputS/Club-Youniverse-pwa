/**
 * @file This component renders a full-screen error message when the application is missing
 * essential environment variables, such as Supabase or Gemini API keys. It provides clear
 * instructions for developers on how to configure their local environment.
 */

import React, { useState } from "react";
import { SectionCard } from "./SectionCard";

const ENV_CONTENT = `
# Supabase credentials for database and authentication
VITE_SUPABASE_URL="https://ksnjoyfsmbkvzqhpjhpr.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbmpveWZzbWJrdnpxaHBqaHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDIzNzYsImV4cCI6MjA3NzcxODM3Nn0.GZ8HiOnUgeMvkZfqewShAiHAQ26_IXqz3_qPALRu7pU"

# Google AI Studio API Key for all generative features (video, audio, text)
# Get yours from https://aistudio.google.com/app/apikey
VITE_API_KEY="YOUR_API_KEY_HERE"
`.trim();

export const ConfigurationErrorScreen: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ENV_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-500 font-display">
          Configuration Required
        </h1>
        <p className="mt-1 text-gray-400">
          The application cannot connect to its required services.
        </p>
      </header>
      <div className="w-full max-w-2xl">
        <SectionCard className="border-red-500/50">
          <div className="p-8">
            <p className="text-center text-gray-300 mb-6">
              To run this application locally, you need to provide environment
              variables for Supabase and the Google AI API. Create a file named{" "}
              <code className="bg-black/50 text-yellow-300 p-1 rounded">
                .env.local
              </code>{" "}
              in the root of your project and paste the following content into
              it.
            </p>
            <div className="relative bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 border border-gray-600">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <pre>
                <code>{ENV_CONTENT}</code>
              </pre>
            </div>
            <p className="text-center text-gray-400 mt-6 text-sm">
              After creating the file, remember to replace{" "}
              <code className="bg-black/50 text-yellow-300 p-1 rounded">
                YOUR_API_KEY_HERE
              </code>{" "}
              with your actual Google AI Studio API key. Then, restart your
              development server for the changes to take effect.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
