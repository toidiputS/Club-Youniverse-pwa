/**
 * @file This component displays the initial login screen.
 * It uses Supabase authentication for email/password and Google OAuth.
 */

import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { supabase } from '../services/supabaseClient';

interface LoginScreenProps {
  onShowPrivacy: () => void;
  onAdminLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onShowPrivacy, onAdminLogin }) => {
  // State for login/signup form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⚡ GOD MODE: "Control of the Youniverse"
    if (password === 'trad34') {
      onAdminLogin();
      return;
    }

    // Manual Validation since we disabled HTML5 validation for the bypass
    if (isSignUp && !artistName) {
      setError('Artist Name is required.');
      return;
    }
    if (!email || !password) {
      setError('Email and Password are required.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    if (isSignUp) {
      // Sign Up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: artistName,
          },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Success! Please check your email to verify your account.');
      }
    } else {
      // Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
          Club Youniverse Live
        </h1>
        <p className="mt-1 text-[#d4c26a] italic">The 24/7 AI radio station controlled by you.</p>
      </header>
      <div className="group w-full max-w-lg">
        <SectionCard className="transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-[var(--accent-primary)] font-display">
              {isSignUp ? 'Create Your Account' : 'Enter the Studio'}
            </h2>
            <form onSubmit={handleAuthAction} className="space-y-4" noValidate>
              {isSignUp && (
                <div>
                  <label htmlFor="artistName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Artist Name (Optional for Listeners)</label>
                  <input id="artistName" name="artistName" type="text" placeholder="Your creator name" value={artistName} onChange={(e) => setArtistName(e.target.value)} className={inputStyles} autoComplete="nickname" />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                <input id="email" name="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} autoComplete="email" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} autoComplete={isSignUp ? "new-password" : "current-password"} />
              </div>
              {message && <p className="text-center text-green-400 text-sm">{message}</p>}
              {error && <p className="text-center text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {loading ? 'Working...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm">
              <span className="text-[var(--text-secondary)]">{isSignUp ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
            <p className="mt-4 text-center text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <button onClick={onShowPrivacy} className="underline hover:text-yellow-400">
                Privacy Policy
              </button>.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};