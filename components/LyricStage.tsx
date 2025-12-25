import React, { useMemo, useState, useEffect } from 'react';
import { ChoreographedLine, AnimationType } from '../types';

interface LyricStageProps {
    currentLine: ChoreographedLine | null;
    nextLine: ChoreographedLine | null;
    previousLine: ChoreographedLine | null;
    intensity?: number;
}

type TransitionType = 'glitch' | 'wipe' | null;

const getFontClass = (font: string | undefined) => {
    switch (font) {
        case 'marker': return 'font-marker';
        case 'tech': return 'font-tech';
        default: return 'font-sans font-black';
    }
};

const getPerpetualAnimation = (type: AnimationType | undefined) => {
    switch (type) {
        case AnimationType.BOUNCE: return 'animate-bounce';
        case AnimationType.SHAKE: return 'animate-shake';
        case AnimationType.GLITCH: return 'animate-glitch';
        case AnimationType.SLIDE: return 'animate-float';
        case AnimationType.EXPLODE: return 'animate-pulse-fast';
        default: return '';
    }
};

export const LyricStage: React.FC<LyricStageProps> = ({ currentLine, nextLine, previousLine, intensity = 0 }) => {

    // Transition State
    const [transitionType, setTransitionType] = useState<TransitionType>(null);

    // Trigger transition effect when line ID changes
    useEffect(() => {
        if (currentLine?.id) {
            // Pick a random transition for variety
            const effects: TransitionType[] = ['glitch', 'wipe', 'glitch'];
            const randomEffect = effects[Math.floor(Math.random() * effects.length)];

            setTransitionType(randomEffect);

            // Reset after animation duration
            const timer = setTimeout(() => {
                setTransitionType(null);
            }, 400); // 400ms matches max duration of css animations

            return () => clearTimeout(timer);
        }
    }, [currentLine?.id]);


    // Memoize word data to generate stable random values for each word
    // This ensures the "randomness" doesn't change on every render frame
    const wordData = useMemo(() => {
        if (!currentLine?.text) return [];

        return currentLine.text.split(' ').map((word: string) => ({
            text: word,
            // Generate a random rotation between -6 and 6 degrees for a kinetic look
            rotation: (Math.random() - 0.5) * 12
        }));
    }, [currentLine]);

    // Determine font size based on character length to prevent overflow
    const getAdaptiveSize = (text: string) => {
        const len = text.length;
        if (len < 5) return 'text-3xl md:text-5xl lg:text-7xl'; // Short words (e.g. "RED") -> Huge
        if (len < 15) return 'text-2xl md:text-4xl lg:text-6xl'; // Medium phrases -> Big
        if (len < 25) return 'text-xl md:text-3xl lg:text-4xl'; // Longer -> Medium
        if (len < 40) return 'text-lg md:text-2xl lg:text-3xl'; // Sentences -> Small
        return 'text-base md:text-lg lg:text-xl'; // Paragraphs -> Smallest
    };

    if (!currentLine) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 animate-pulse font-tech tracking-widest text-sm md:text-base">
                WAITING FOR SIGNAL...
            </div>
        );
    }

    const { meta } = currentLine;
    const isGlitch = meta?.animation === AnimationType.GLITCH;
    const fontClass = getFontClass(meta?.fontFamily);
    const perpetualClass = getPerpetualAnimation(meta?.animation);
    const sizeClass = getAdaptiveSize(currentLine.text);

    // Helper to render the word set
    const renderWords = (_isReflection = false) => {
        // Dynamic stagger delay:
        // Base delay ranges from 0.12s (low intensity) down to 0.04s (high intensity)
        // Long sentences get a multiplier to speed up the sequence so it fits the measure
        const baseDelay = 0.12 - (intensity * 0.08);
        const lengthModifier = wordData.length > 5 ? 0.5 : 1;
        const staggerDelay = Math.max(0.02, baseDelay * lengthModifier);

        return (
            <div className="flex flex-wrap justify-center items-center gap-x-[0.3em] gap-y-1">
                {wordData.map((item: { text: string; rotation: number }, i: number) => (
                    <span
                        key={`${currentLine.id}-${i}`}
                        className="inline-block origin-bottom"
                        style={{
                            // Staggered Entrance
                            // Use ease-out to let the keyframes (scale 1.1) drive the visual bounce
                            animation: `popIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                            animationDelay: `${i * staggerDelay}s`
                        }}
                    >
                        {/* 
              Rotation Wrapper 
              Isolated so it doesn't conflict with transform animations on parent or child 
            */}
                        <span
                            className="inline-block"
                            style={{ transform: `rotate(${item.rotation}deg)` }}
                        >
                            <span
                                className={`inline-block ${perpetualClass}`}
                                style={{
                                    // Add slight random delay to perpetual animation so they don't all bounce in perfect sync (unless intended)
                                    animationDelay: meta?.animation === AnimationType.BOUNCE ? `${i * 0.1}s` : '0s'
                                }}
                            >
                                {item.text}
                            </span>
                        </span>
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden perspective-1000 p-8 md:p-12">

            {/* Transition Effects Layer (Overlay) - Removed Glitch Overlay */}
            {transitionType === 'wipe' && (
                <div className="absolute left-0 w-full h-1/4 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-scanline-wipe z-50 pointer-events-none blur-md" />
            )}

            {/* Background Echo / Secondary Text */}
            {meta?.secondaryText && (
                <div
                    className="absolute text-4xl md:text-6xl font-black opacity-10 select-none pointer-events-none whitespace-nowrap blur-sm"
                    style={{
                        color: meta.color,
                        top: '20%',
                        transform: `rotate(${-1 * (meta.rotation || 0)}deg) scale(1.5)`
                    }}
                >
                    {meta.secondaryText.toUpperCase()}
                </div>
            )}

            {/* Previous Line - Fading Out Upwards */}
            <div
                key={previousLine?.id}
                className="absolute top-8 w-full flex justify-center pointer-events-none animate-fade-out-up"
            >
                <p className="text-xs md:text-sm text-white/50 font-sans tracking-widest uppercase font-bold blur-[1px]">
                    {previousLine?.text}
                </p>
            </div>

            {/* Main Lyric Wrapper - Handles Glitch Transition */}
            {/* Wrapping the main stage allows us to apply glitch-snap to the container without conflicting with inner transforms */}
            <div className={`w-full flex justify-center items-center ${transitionType === 'glitch' ? 'animate-glitch-snap' : ''}`}>

                {/* Main Lyric Display */}
                <div
                    key={currentLine.id} // Key change triggers re-mount for animations
                    className="relative z-10 w-full flex justify-center items-center max-w-[90%]" // Constrain width
                    style={{
                        transform: `scale(${meta?.scale || 1}) rotate(${meta?.rotation || 0}deg)`,
                        transition: 'transform 0.5s ease-out'
                    }}
                >
                    <div
                        className={`leading-tight text-center ${fontClass} ${sizeClass}`}
                        style={{
                            color: isGlitch ? 'white' : meta?.color,
                            // Dynamic text shadow and filters based on --audio-bass variable from App.tsx
                            textShadow: isGlitch
                                ? `2px 0 red, -2px 0 blue`
                                : `0 0 10px ${meta?.color || 'white'}, 0 0 calc(30px + var(--audio-bass, 0) * 40px) ${meta?.color || 'white'}`,
                            filter: 'saturate(calc(100% + var(--audio-bass, 0) * 100%)) brightness(calc(100% + var(--audio-bass, 0) * 40%))'
                        }}
                    >
                        {renderWords(false)}
                    </div>

                    {/* Mirror Reflection Effect - Faded and smaller */}
                    <div
                        className={`absolute left-0 right-0 top-[90%] transform -scale-y-100 opacity-20 blur-sm pointer-events-none select-none text-center ${fontClass} ${sizeClass} leading-tight`}
                        style={{
                            color: meta?.color,
                            filter: 'saturate(calc(100% + var(--audio-bass, 0) * 100%))'
                        }}
                    >
                        {renderWords(true)}
                    </div>
                </div>
            </div>

            {/* Next Line - Preview */}
            <div className="absolute bottom-6 opacity-40 transform translate-y-4 scale-90 transition-all duration-500 max-w-[80%] text-center">
                <p className="text-[10px] md:text-xs text-gray-300 font-sans tracking-wide truncate">
                    {nextLine?.text ? `>> ${nextLine.text}` : ''}
                </p>
            </div>

        </div>
    );
};
