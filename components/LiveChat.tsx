/**
 * @file This component renders the live chat panel.
 * It displays messages from the global RadioContext and provides an input field for the user to send their own messages.
 */

import React, { useState, useEffect, useRef, useContext } from 'react';
import type { ChatMessage, Profile } from '../types';
import { RadioContext } from '../contexts/AudioPlayerContext';

interface LiveChatProps {
    onDjMention: (message: string) => void;
    profile: Profile | null;
}

export const LiveChat: React.FC<LiveChatProps> = ({ onDjMention, profile }) => {
    const { chatMessages, addChatMessage, clearChatMessages } = useContext(RadioContext);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Effect to automatically scroll to the bottom of the chat when new messages arrive.
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    /**
     * Handles the submission of a new chat message from the user.
     */
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = input.trim();
        if (messageText === '') return;
        
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            user: { name: profile?.name || 'You' },
            text: messageText,
            timestamp: Date.now(),
        };

        // Add the message to the global chat state.
        addChatMessage(userMessage);

        // If it's a mention, trigger the callback for the DJ.
        if (messageText.toLowerCase().startsWith('@clubdj ')) {
            onDjMention(messageText);
        }

        // Clear the input field.
        setInput('');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold font-display text-yellow-400">Live Chat</h3>
                <button
                    onClick={clearChatMessages}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full"
                    title="Clear Chat"
                    aria-label="Clear all chat messages"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            {/* Scrollable chat message area */}
            <div className="chat-messages-container flex-grow space-y-3 pr-2 overflow-y-auto mb-4 min-h-0">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className="chat-message rounded-lg p-2 bg-black/50 backdrop-blur-sm border border-white/10">
                        <p className="text-gray-200 break-words text-sm">
                            <span className={`font-semibold mr-2 ${msg.user.name === 'Club Youniverse' ? 'text-yellow-400' : 'text-gray-400'}`}>
                               {msg.user.name}:
                            </span>
                            {msg.text}
                        </p>
                         {/* Special rendering for messages with a source link (e.g., news stories) */}
                         {msg.source && (
                            <a 
                                href={msg.source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block mt-1 text-xs bg-gray-800/70 p-2 rounded-md hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-bold text-yellow-400 block truncate">{msg.source.title}</span>
                                <span className="text-gray-400 truncate block">{msg.source.uri}</span>
                            </a>
                        )}
                    </div>
                ))}
                {/* Empty div used as a reference to scroll to the end of the chat */}
                <div ref={chatEndRef} />
            </div>
            {/* Chat input form */}
            <form onSubmit={handleSend} className="flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Say something... (@clubdj)"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none"
                />
            </form>
            <style>{`
                .chat-message {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(15px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                .chat-messages-container {
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 100%);
                    mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 100%);
                }
            `}</style>
        </div>
    );
};