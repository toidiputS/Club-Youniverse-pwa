/**
 * @file This component displays the application's privacy policy.
 * It's a static informational component shown as an overlay.
 */
import React from "react";
import { SectionCard } from "./SectionCard";

interface PrivacyPolicyProps {
  onBack: () => void;
}

/**
 * A sub-component containing the main text of the policy for better readability.
 */
const PrivacyPolicyContent: React.FC = () => (
  <div className="space-y-4 text-gray-300">
    <h3 className="text-2xl font-bold text-yellow-400 font-display">
      Introduction
    </h3>
    <p>
      Welcome to Club Youniverse Live ("we," "our," "us"). We are committed to
      protecting your privacy. This Privacy Policy explains how we collect, use,
      disclose, and safeguard your information when you use our application.
    </p>

    <h3 className="text-2xl font-bold text-yellow-400 font-display pt-4">
      Information We Collect
    </h3>
    <p>
      We may collect information about you in a variety of ways. The information
      we may collect includes:
    </p>
    <ul className="list-disc list-inside space-y-2 pl-4">
      <li>
        <strong>Personal Data:</strong> Personally identifiable information,
        such as your email address and artist name, that you voluntarily give to
        us when you register with the application. This is managed through our
        authentication provider, Supabase.
      </li>
      <li>
        <strong>User-Generated Content:</strong> We collect the audio files,
        song titles, artist names, lyrics, and other creative inputs you provide
        when using our services, such as the Music Video Generator, Album Cover
        Generator, and Song Submission features.
      </li>
      <li>
        <strong>Generated Media:</strong> We store the output of our AI
        generators, such as music videos and album covers, which are linked to
        your user account in our database.
      </li>
    </ul>

    <h3 className="text-2xl font-bold text-yellow-400 font-display pt-4">
      How We Use Your Information
    </h3>
    <p>
      Having accurate information about you permits us to provide you with a
      smooth, efficient, and customized experience. Specifically, we may use
      information collected about you to:
    </p>
    <ul className="list-disc list-inside space-y-2 pl-4">
      <li>Create and manage your account.</li>
      <li>
        Attribute your submitted and generated content to your artist name.
      </li>
      <li>
        Operate the core game mechanics of the radio station (e.g., "The Box").
      </li>
      <li>Provide the AI generation services you request.</li>
      <li>Monitor and analyze usage and trends to improve your experience.</li>
    </ul>

    <h3 className="text-2xl font-bold text-yellow-400 font-display pt-4">
      Third-Party Services
    </h3>
    <p>We use the following third-party services to operate our application:</p>
    <ul className="list-disc list-inside space-y-2 pl-4">
      <li>
        <strong>Supabase:</strong> We use Supabase for user authentication
        (including Google OAuth) and as our database to store your profile
        information and content. You can review Supabase's privacy policy{" "}
        <a
          href="https://supabase.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-400 hover:underline"
        >
          here
        </a>
        .
      </li>
      <li>
        <strong>Google Gemini API:</strong> Our core AI features are powered by
        Google's Gemini API. The content you provide as prompts (lyrics, style
        keywords, etc.) is sent to Google's servers to generate the creative
        output. Your API key is handled client-side and is not stored by us. We
        encourage you to review Google's API Privacy Policy.
      </li>
    </ul>

    <h3 className="text-2xl font-bold text-yellow-400 font-display pt-4">
      Security of Your Information
    </h3>
    <p>
      We use administrative, technical, and physical security measures to help
      protect your personal information. While we have taken reasonable steps to
      secure the personal information you provide to us, please be aware that
      despite our efforts, no security measures are perfect or impenetrable, and
      no method of data transmission can be guaranteed against any interception
      or other type of misuse.
    </p>

    <h3 className="text-2xl font-bold text-yellow-400 font-display pt-4">
      Contact Us
    </h3>
    <p>
      If you have questions or comments about this Privacy Policy, please
      contact us at listen@clubyouniverse.live.
    </p>
  </div>
);

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-start mb-12">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
            Privacy Policy
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Last Updated: {today}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
        >
          &larr; Back
        </button>
      </header>

      <SectionCard>
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <PrivacyPolicyContent />
        </div>
      </SectionCard>
      <style>{`
          .animate-fade-in {
              animation: fadeIn 0.5s ease-in-out;
          }
          @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
          }
      `}</style>
    </div>
  );
};
