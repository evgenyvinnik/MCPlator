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
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1e1e1e] via-[#252526] to-[#1e1e1e] text-slate-100">
      <div className="flex items-center justify-between border-b border-[#3e3e42] bg-gradient-to-r from-[#2d2d30] to-[#252526] px-5 py-3.5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#007acc]/30 bg-gradient-to-br from-[#007acc]/20 to-[#005a9e]/20 font-mono text-sm text-[#4fc3f7] shadow-lg shadow-[#007acc]/20">
            {'>_'}
          </div>
          <div>
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#4fc3f7]">Calculator Copilot</p>
            <p className="text-xs text-[#cccccc]">AI-powered math assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          Active
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#1e1e1e] px-5 py-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-[#3e3e42] bg-gradient-to-br from-[#2d2d30] to-[#252526] px-4 py-6 text-center text-slate-300 shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#007acc] to-[#005a9e] shadow-lg shadow-[#007acc]/30">
              <span className="text-xl">💬</span>
            </div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#4fc3f7]">Start a conversation</p>
            <p className="mt-2 text-sm text-[#cccccc]">
              Ask the copilot to perform calculations or guide you through complex math problems.
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
                  relative max-w-[92%] rounded-lg border p-4 shadow-xl
                  ${isUser 
                    ? 'border-[#007acc]/40 bg-gradient-to-br from-[#094771] to-[#05334d] shadow-[#007acc]/20' 
                    : 'border-[#3e3e42] bg-gradient-to-br from-[#2d2d30] to-[#252526]'}
                `}
              >
                <div className="mb-2 flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.16em]">
                  <span className={`h-1.5 w-1.5 rounded-full ${isUser ? 'bg-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/50' : 'bg-emerald-400 shadow-lg shadow-emerald-400/50'}`} />
                  <span className={isUser ? 'text-[#4fc3f7]' : 'text-emerald-400'}>{isUser ? 'You' : 'Copilot'}</span>
                </div>
                <p className="font-mono whitespace-pre-line text-sm leading-relaxed text-[#d4d4d4]">
                  {msg.text}
                </p>
                <div className={`absolute inset-y-3 left-2 w-[2px] rounded-full ${isUser ? 'bg-gradient-to-b from-transparent via-[#007acc]/40 to-transparent' : 'bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent'}`} />
              </div>
            </div>
          );
        })}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="relative max-w-[92%] rounded-lg border border-[#3e3e42] bg-gradient-to-br from-[#2d2d30] to-[#252526] px-4 py-3 text-sm italic text-slate-200 shadow-xl">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.16em]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                <span className="text-emerald-400">Copilot is thinking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/50" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/50 [animation-delay:200ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/50 [animation-delay:400ms]" />
              </div>
              <div className="absolute inset-y-3 left-2 w-[2px] rounded-full bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#3e3e42] bg-gradient-to-r from-[#2d2d30] to-[#252526] px-5 py-4 shadow-xl">
        <div className="relative overflow-hidden rounded-lg border border-[#3e3e42] bg-gradient-to-r from-[#1e1e1e] via-[#252526] to-[#1e1e1e] shadow-2xl transition-all focus-within:border-[#007acc] focus-within:shadow-[0_0_20px_rgba(0,122,204,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#007acc]/5 via-[#005a9e]/5 to-[#007acc]/5 opacity-0 transition-opacity focus-within:opacity-100" />
          <div className="relative flex items-center gap-2">
            <span className="pl-4 pr-2 text-xs font-mono font-semibold uppercase tracking-[0.12em] text-[#858585]">&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the copilot to perform calculations..."
              className="flex-1 bg-transparent px-1 py-3.5 font-mono text-sm text-[#cccccc] placeholder-[#6a6a6a] focus:outline-none"
              disabled={isThinking}
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="m-1.5 rounded-md bg-gradient-to-r from-[#007acc] to-[#005a9e] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#007acc]/30 transition-all hover:from-[#1e8ad6] hover:to-[#0066b8] hover:shadow-xl hover:shadow-[#007acc]/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-[#007acc] disabled:hover:to-[#005a9e]"
            >
              Send
            </button>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#858585]">
          <span>Press <kbd className="rounded bg-[#3e3e42] px-1.5 py-0.5 text-[#cccccc]">Enter</kbd> to send</span>
          <span className="text-[#4fc3f7]">Powered by AI</span>
        </div>
      </form>
    </div>
  );
};
