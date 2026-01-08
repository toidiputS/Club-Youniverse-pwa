/**
 * @file TheChat Component - Simplified Live Chat for Club Youniverse.
 */

import React, { useContext, useState, useEffect, useRef } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { supabase } from "../services/supabaseClient";
import type { ChatMessage, Profile } from "../types";

interface TheChatProps {
    profile: Profile;
}

export const TheChat: React.FC<TheChatProps> = ({ profile }) => {
    const context = useContext(RadioContext);
    if (!context) return null;

    const { chatMessages, addChatMessage } = context;
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        // Realtime chat subscription
        const channel = supabase.channel('club-chat')
            .on('broadcast', { event: 'new_message' }, ({ payload }) => {
                addChatMessage(payload);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [addChatMessage]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const message: ChatMessage = {
            id: Date.now().toString(),
            user: {
                name: profile.name || "Anonymous",
                isAdmin: profile.is_admin
            },
            text: input,
            timestamp: Date.now()
        };

        // Broadcast to others
        await supabase.channel('club-chat').send({
            type: 'broadcast',
            event: 'new_message',
            payload: message
        });

        // Add locally
        addChatMessage(message);
        setInput("");
    };

    return (
        <div className="flex flex-col h-[500px] bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl group transition-all hover:bg-black/60">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Chat</h3>
                <span className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    Live
                </span>
            </div>

            <div
                ref={scrollRef}
                className="flex-grow overflow-y-auto p-5 space-y-3 scrollbar-hide"
            >
                {chatMessages.map((msg) => (
                    <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-tighter mb-0.5 opacity-60 ${msg.user.isAdmin ? 'text-purple-400' : 'text-zinc-400'}`}>
                                {msg.user.name}
                            </span>
                            <div className={`inline-block py-2 px-3 rounded-xl text-xs ${msg.user.isAdmin ? 'bg-purple-500/10 border border-purple-500/20 text-zinc-200' : 'bg-white/5 text-zinc-300'}`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Say something..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/30 transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1 bottom-1 aspect-square bg-purple-600/50 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};
