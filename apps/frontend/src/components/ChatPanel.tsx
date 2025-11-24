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
    <div className="relative flex h-full min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[28px] bg-[#05060c] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-8 rounded-[34px] bg-[conic-gradient(at_10%_10%,#ff2d55,#a855f7,#6366f1,#22d3ee,#10b981,#f59e0b,#ff2d55)] opacity-50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.14),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.16),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="absolute inset-0 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] via-[#05060c]/90 to-[#03040a]" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,#22d3ee,#a855f7,#f97316,#22d3ee)] opacity-70 blur-md" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-[0_10px_40px_rgba(99,102,241,0.25)]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Agentic workspace</p>
              <p className="text-lg font-semibold text-white">Math Copilot</p>
              <p className="text-[11px] text-slate-500">Gemini-style chat, tuned for math</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 shadow-[0_10px_30px_rgba(16,185,129,0.18)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-semibold">Live</span>
          </div>
        </header>

        <div className="relative flex-1 px-6 pb-5">
          <div className="pointer-events-none absolute left-4 top-20 bottom-32 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent blur-sm" />
          <div className="pointer-events-none absolute right-4 top-12 bottom-28 w-px bg-gradient-to-b from-transparent via-fuchsia-400/35 to-transparent blur-sm" />

          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_25px_120px_rgba(79,70,229,0.18)]">
            <div className="flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span>Conversation</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-5">
              {messages.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center shadow-inner shadow-black/30">
                  <div className="relative mx-auto mb-4 h-16 w-16">
                    <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(at_30%_30%,#f472b6,#6366f1,#22d3ee,#a855f7,#f472b6)] opacity-60 blur-lg" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">Drop in a prompt</p>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                    Think VS Code agents or Gemini: ask for a proof, a breakdown, or have the co-pilot check your work.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Explain a theorem', 'Fix my algebra', 'Generate a practice set'].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      {isUser ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-lg shadow-blue-500/20">
                          <svg className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="relative h-9 w-9">
                          <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(at_40%_40%,#a855f7,#22d3ee,#f472b6,#a855f7)] opacity-60 blur-sm" />
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isUser ? 'text-blue-200' : 'text-fuchsia-200'}`}>
                          {isUser ? 'You' : 'Math Copilot'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">just now</span>
                      </div>
                      <div
                        className={`group relative rounded-3xl border p-4 shadow-[0_15px_70px_rgba(0,0,0,0.35)] ${
                          isUser
                            ? 'border-blue-500/25 bg-gradient-to-br from-blue-950/60 to-blue-900/30'
                            : 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03]'
                        }`}
                      >
                        {!isUser && (
                          <div className="absolute -left-[3px] top-5 bottom-5 w-[3px] rounded-full bg-gradient-to-b from-fuchsia-400 via-blue-400 to-cyan-300" />
                        )}
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-100 font-['Inter']">
                          {msg.text}
                        </p>
                        <div className="pointer-events-none absolute inset-[1px] rounded-[26px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_top,#ffffff0f,transparent_45%)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex gap-3">
                  <div className="relative h-9 w-9 flex-shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(at_40%_40%,#a855f7,#22d3ee,#f472b6,#a855f7)] opacity-60 blur-sm animate-pulse" />
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <svg className="h-4 w-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-fuchsia-200">Math Copilot</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">thinking...</span>
                    </div>
                    <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 shadow-[0_15px_70px_rgba(0,0,0,0.35)]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-400 to-blue-400 animate-pulse shadow-lg shadow-fuchsia-500/40" />
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse shadow-lg shadow-blue-500/40 [animation-delay:180ms]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 animate-pulse shadow-lg shadow-amber-500/40 [animation-delay:320ms]" />
                        </div>
                        <span className="text-xs text-slate-400">Working on it</span>
                      </div>
                      <div className="absolute -left-[3px] top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-fuchsia-400 via-blue-400 to-cyan-300 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/5 bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02] px-5 py-4">
              <div className="group relative">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[conic-gradient(at_20%_20%,#ff2d55,#a855f7,#6366f1,#22d3ee,#10b981,#f59e0b,#ff2d55)] opacity-70 blur-xl transition-opacity duration-500 group-focus-within:opacity-95" />
                <div className="pointer-events-none absolute inset-[2px] rounded-[18px] bg-gradient-to-r from-fuchsia-500/10 via-cyan-400/10 to-amber-300/10 ring-1 ring-white/10" />
                <div className="relative flex items-center gap-3 rounded-[18px] bg-[#05060c]/95 px-4 py-3 shadow-[0_15px_90px_rgba(34,211,238,0.14)] backdrop-blur-xl">
                  <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask, debug, or describe what you need..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-['Inter']"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    disabled={isThinking || !input.trim()}
                    className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-blue-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_40px_rgba(56,189,248,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_15px_55px_rgba(168,85,247,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>Send</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-400">Enter</kbd>
                  <span>to send • Shift + Enter for new line</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-fuchsia-400 via-blue-400 to-cyan-300 bg-clip-text font-semibold text-transparent">
                    AI co-pilot
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
