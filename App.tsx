/**
 * @file This is the root component of the application for the Club Youniverse Launch.
 * It manages authentication and serves as the main entry point for the Club and DJ Booth.
 */

import React, { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Radio as Club } from "./components/Radio";
import { DjBooth } from "./components/DjBooth";
import { Loader } from "./components/Loader";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { SiteEffects } from "./components/SiteEffects";
import { Ticker } from "./components/Ticker";
import { TuneInOverlay } from "./components/TuneInOverlay";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RadioProvider } from "./contexts/AudioPlayerContext";
import { supabase } from "./services/supabaseClient";
import type { View, Session, Profile } from "./types";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("club");

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (!data) {
          // Auto-create profile
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([{
              user_id: userId,
              name: "New Listener",
              is_premium: false,
              is_artist: false,
              is_admin: false,
              stats: { plays: 0, uploads: 0, votes_cast: 0, graveyard_count: 0 }
            }])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching/creating profile:", err);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const handleAdminLogin = () => {
    // Mock Admin Session for God Mode
    const mockProfile: Profile = {
      user_id: "god-mode-admin",
      name: "The Creator",
      is_premium: true,
      is_artist: true,
      is_admin: true,
      roast_consent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stats: { plays: 999999, uploads: 999, votes_cast: 999, graveyard_count: 0 }
    };
    setProfile(mockProfile);
    setSession({ user: { id: "god-mode-admin" } } as Session);
    setCurrentView("dj-booth");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader message="Tuning in to Club Youniverse..." />
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <ThemeProvider>
        <LoginScreen onShowPrivacy={() => { }} onAdminLogin={handleAdminLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <RadioProvider profile={profile} setProfile={setProfile}>
        <AudioVisualizer />
        <SiteEffects />
        <TuneInOverlay />
        <div className="h-screen relative z-10 flex flex-col overflow-hidden text-white">
          <main className="flex-grow flex flex-col relative min-h-0">
            {currentView === "club" ? (
              <Club onNavigate={handleNavigate} onSignOut={handleSignOut} profile={profile} setProfile={setProfile} />
            ) : (
              <DjBooth onNavigate={handleNavigate} onSignOut={handleSignOut} />
            )}
          </main>
          <Ticker />
        </div>
      </RadioProvider>
    </ThemeProvider>
  );
};

export default App;
