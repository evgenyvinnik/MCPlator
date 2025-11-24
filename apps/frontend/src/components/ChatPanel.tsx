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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="bg-gray-100 p-4 border-b border-gray-200 font-bold text-gray-700">
        Calculator Brain
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Ask me to calculate something!
            <br />
            <span className="text-sm">"Add 50 and 20 then multiply by 3"</span>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-lg text-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none text-sm italic animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a request..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
