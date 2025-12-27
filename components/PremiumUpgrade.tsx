/**
 * @file PremiumUpgrade.tsx - A component to handle the upgrade flow from Free to VIP.
 */

import React, { useState } from "react";
import { SectionCard } from "./SectionCard";
import { Loader } from "./Loader";
import type { Profile } from "../types";
import { updateProfile } from "../services/supabaseSongService";

interface PremiumUpgradeProps {
  profile: Profile;
  onUpgradeComplete: (updatedProfile: Profile) => void;
  onCancel: () => void;
}

export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({
  profile,
  onUpgradeComplete,
  onCancel,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || "");
  const [roastConsent, setRoastConsent] = useState(
    profile.roast_consent || false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      setError("A phone number is required for VIP perks and live roasts.");
      return;
    }

    if (!roastConsent) {
      setError("You must agree to the Live Roast Disclosure to become a VIP.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedData = {
        is_premium: true,
        phone_number: phoneNumber,
        roast_consent: roastConsent,
      };

      await updateProfile(profile.user_id, updatedData);

      // Return the updated profile object to the parent
      onUpgradeComplete({
        ...profile,
        ...updatedData,
      });
    } catch (err: any) {
      setError(err.message || "Failed to upgrade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles =
    "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

  return (
    <SectionCard>
      <div className="p-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--accent-primary)] mb-2 font-display">
            Upgrade to VIP
          </h2>
          <p className="text-[var(--text-secondary)]">
            Unlock uploads, downloads, and join the elite rotation.
          </p>
        </div>

        {isLoading ? (
          <Loader message="Processing your VIP upgrade..." />
        ) : (
          <form onSubmit={handleUpgrade} className="space-y-6 text-left">
            <div className="bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 p-4 rounded-lg mb-6">
              <h3 className="text-[var(--accent-secondary)] font-bold mb-2">
                🔥 VIP Perks:
              </h3>
              <ul className="text-sm list-disc list-inside space-y-1 text-[var(--text-primary)]">
                <li>Unlimited Song Uploads</li>
                <li>High-Quality Song Downloads</li>
                <li>Priority placement in The Box</li>
                <li>Eligibility for the Live Zero-Star Roast</li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Phone Number (Mandatory for VIP)
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className={inputStyles}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for live interaction with the AI DJ.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-500/20 rounded-lg">
              <input
                id="roast-consent"
                type="checkbox"
                checked={roastConsent}
                onChange={(e) => setRoastConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <label
                htmlFor="roast-consent"
                className="text-sm text-[var(--text-primary)] leading-tight"
              >
                <span className="font-bold text-red-400 block mb-1">
                  LIVE ROAST DISCLOSURE
                </span>
                I agree to be roasted live on air by the AI DJ if my song hits
                zero stars. I understand this involves a live call to the phone
                number provided above.
              </label>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold py-4 px-6 rounded-lg hover:shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.4)] transition-all transform hover:scale-[1.02]"
              >
                Confirm VIP Membership ($10/mo)
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </form>
        )}
      </div>
    </SectionCard>
  );
};
