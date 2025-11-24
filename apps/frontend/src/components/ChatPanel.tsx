import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../state/useChatStore';
import { useSendChat } from '../hooks/useSendChat';

export const ChatPanel: React.FC = () => {
  const { messages, isThinking } = useChatStore();
  const sendChat = useSendChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    sendChat(input);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-transparent text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm text-cyan-200 shadow-inner shadow-black/50">
            {'>_'}
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-300">Calculator Brain</p>
            <p className="text-sm text-slate-300">Codex channel · VS Code vibe</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-slate-300 shadow-inner shadow-black/40">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">No thread yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Ask the co-pilot to plan a calculation or stream a sequence of keypresses.
            </p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  relative max-w-[92%] rounded-xl border p-4 shadow-[0_12px_45px_rgba(0,0,0,0.45)]
                  ${isUser 
                    ? 'border-cyan-400/20 bg-gradient-to-br from-[#18213a] to-[#0f1628]' 
                    : 'border-white/10 bg-white/5'}
                `}
              >
                <div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${isUser ? 'bg-cyan-300' : 'bg-emerald-300'}`} />
                  {isUser ? 'You' : 'Codex'}
                </div>
                <p className="font-mono whitespace-pre-line text-sm leading-relaxed text-slate-100">
                  {msg.text}
                </p>
                <div className="absolute inset-y-3 left-2 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              </div>
            </div>
          );
        })}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="relative max-w-[92%] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm italic text-slate-200 shadow-[0_12px_45px_rgba(0,0,0,0.45)]">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Drafting
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[rgba(6,11,24,0.8)] px-5 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(14,22,44,0.8)] shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <span className="pl-4 pr-2 text-xs font-mono uppercase tracking-[0.12em] text-slate-500">calc&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent to run steps on the calculator"
            className="flex-1 bg-transparent px-1 py-3 text-white placeholder-slate-600 focus:outline-none"
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="m-1 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 font-semibold text-white shadow-[0_10px_30px_rgba(76,201,240,0.35)] transition hover:from-cyan-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] font-mono text-slate-500">Press Enter to transmit.</p>
      </form>
    </div>
  );
};
