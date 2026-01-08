/**
 * @file SiteEffects Component - Handles global visual and audio effects triggered by the DJ.
 */

import React, { useEffect, useState, useRef } from "react";
import { getBroadcastManager } from "../services/globalBroadcastManager";

export const SiteEffects: React.FC = () => {
    const [activeFx, setActiveFx] = useState<string | null>(null);
    const broadcastManager = useRef(getBroadcastManager()).current;

    useEffect(() => {
        const handleCommand = (cmd: any) => {
            console.log("🌌 SiteEffects: Received command", cmd);

            if (cmd.type === "trigger_fx") {
                const fx = cmd.payload?.fx;
                setActiveFx(fx);

                // Auto-clear FX after duration
                setTimeout(() => {
                    setActiveFx(null);
                }, 5000);
            }

            if (cmd.type === "tts") {
                const { text, voice } = cmd.payload || {};
                if (text) {
                    playTts(text, voice);
                }
            }
        };

        broadcastManager.on("siteCommandReceived", handleCommand);
        return () => broadcastManager.off("siteCommandReceived", handleCommand);
    }, [broadcastManager]);

    const playTts = (text: string, _voice?: string) => {
        // Basic browser TTS for now, could be upgraded to ElevenLabs API call
        console.log("🎙️ Playing TTS:", text);
        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to find a cool voice
        const voices = window.speechSynthesis.getVoices();
        const deepVoice = voices.find(v => v.name.includes("Male") || v.name.includes("Deep")) || voices[0];
        if (deepVoice) utterance.voice = deepVoice;

        utterance.pitch = 0.8;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <>
            {/* Glitch Overlay */}
            {activeFx === "Glitch" && (
                <div className="fixed inset-0 z-[100] pointer-events-none mix-blend-difference animate-glitch-active bg-purple-500/20" />
            )}

            {/* Shake Effect applied via class on body if needed, but here we show a centered splash */}
            {activeFx === "Shake" && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full bg-white/5 animate-shake" />
                </div>
            )}

            {/* Confetti (Simple CSS version) */}
            {activeFx === "Confetti" && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-confetti-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                                animationDelay: `${Math.random() * 3}s`,
                                top: `-10px`
                            }}
                        />
                    ))}
                </div>
            )}

            <style>{`
        @keyframes glitch-active {
            0% { transform: translate(0); }
            20% { transform: translate(-5px, 5px); clip-path: inset(10% 0 30% 0); }
            40% { transform: translate(5px, -5px); clip-path: inset(40% 0 10% 0); }
            60% { transform: translate(-5px, 0); clip-path: inset(0 0 50% 0); }
            100% { transform: translate(0); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-10px, 0); }
            20%, 40%, 60%, 80% { transform: translate(10px, 0); }
        }

        @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0); }
            100% { transform: translateY(110vh) rotate(720deg); }
        }
        
        .animate-glitch-active { animation: glitch-active 0.2s infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        .animate-confetti-fall { animation: confetti-fall 3s linear forwards; }
      `}</style>
        </>
    );
};
