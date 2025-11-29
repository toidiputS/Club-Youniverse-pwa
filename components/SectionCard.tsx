/**
 * @file A reusable card component with consistent styling for sections of the UI.
 * It supports custom background images from the theme context and has a blurred, semi-transparent look.
 */
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className = '' }) => {
  // Access settings from the theme context to check for a custom background.
  const { settings } = useContext(ThemeContext);

  // Base styles for the card, using CSS variables for theming.
  const style: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    backdropFilter: 'blur(16px)', // Creates the "glassmorphism" effect.
  };

  // If a custom background is set in the settings, apply it as a background image.
  if (settings.customCardBackground) {
    style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${settings.customCardBackground})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }

  return (
    <div 
      className={`border rounded-2xl shadow-lg shadow-black/20 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};