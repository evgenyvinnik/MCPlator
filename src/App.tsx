import { useEffect, useMemo, useState } from 'react';
import CalculatorDigital from './CalculatorDigital';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function App() {
  const {
    quota,
    messages,
    input,
    setInput,
    sendMessage,
    progress
  } = useAppLogic();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-500 font-semibold">MCPlator</p>
            <h1 className="text-4xl font-bold text-slate-900">MCP + Calculator, side by side</h1>
            <p className="text-slate-600 max-w-2xl">
              Use the tactile calculator or ask the on-board agent to drive it for you. An old-school keypad meets a modern,
              gradient-clad LLM console.
            </p>
          </div>
          <div className="glass-card rounded-2xl px-4 py-3 shadow-lg border border-white/50">
            <p className="text-xs uppercase tracking-wide text-slate-500">Daily quota</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                <span
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">{quota}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[430px,1fr] items-start">
          <CalculatorDigital />

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-cyan-300 blur-[26px] opacity-50" />
            <div className="relative rounded-3xl bg-slate-950/90 text-white p-[2px] shadow-2xl">
              <div className="rounded-[22px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 space-y-4 min-h-[520px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Agent console</p>
                    <h2 className="text-2xl font-semibold">LLM sidekick</h2>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-cyan-200 border border-white/10">
                    {quota > 0 ? `${quota} turns left` : 'Quota reached'}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 max-h-[360px] overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg shadow-black/10 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white'
                            : 'bg-white/10 text-slate-100 border border-white/10'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={quota > 0 ? 'Ask the agent to add 42 and 17…' : 'Quota reached for today'}
                    value={input}
                    disabled={quota <= 0}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={quota <= 0}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 shadow-lg shadow-indigo-500/30 ${
                      quota > 0
                        ? 'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-white hover:shadow-xl'
                        : 'bg-slate-700 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Send
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  The assistant interprets natural language and sends precise instructions to the calculator, but you can always
                  tap the physical keys on the left for full control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useAppLogic() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hey there! Tell me what you want to compute and I will talk to the calculator for you. You can also tap the keys yourself.',
    },
  ]);
  const [input, setInput] = useState('');
  const [quota, setQuota] = useState(20);

  useEffect(() => {
    const stored = Number(localStorage.getItem('mcplator_quota'));
    if (!Number.isNaN(stored) && stored > 0) {
      setQuota(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mcplator_quota', quota.toString());
  }, [quota]);

  const sendMessage = () => {
    if (!input.trim() || quota <= 0) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setQuota((prev) => Math.max(prev - 1, 0));

    const reply = buildAssistantReply(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    }, 350);
  };

  const progress = useMemo(() => Math.max(0, Math.min(100, (quota / 20) * 100)), [quota]);

  return { quota, setQuota, messages, setMessages, input, setInput, sendMessage, progress };
}

const buildAssistantReply = (prompt: string) => {
  const expression = extractExpression(prompt);
  if (expression) {
    const evaluated = safeEvaluate(expression);
    if (evaluated !== null) {
      return `I parsed "${expression}" and got ${evaluated}. Tap = on the calculator to verify or continue from there.`;
    }
  }
  return "I'll keep the calculator ready. Try something like 'compute 42*13 - 8'.";
};

const extractExpression = (text: string) => {
  const matches = text.match(/[\d+\-*/().%\s]+/g);
  if (!matches) return null;
  const candidate = matches[matches.length - 1].trim();
  if (!candidate) return null;
  const valid = /^[\d+\-*/().%\s]+$/.test(candidate);
  return valid ? candidate : null;
};

const safeEvaluate = (expression: string) => {
  try {
    // Replace percentage signs with decimal multipliers for simple expressions.
    const sanitized = expression.replace(/%/g, '*0.01');
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === 'number' && Number.isFinite(result)) {
      return Number(parseFloat(result.toFixed(6)));
    }
  } catch (error) {
    console.error('Evaluation error', error);
  }
  return null;
};

export default App;
