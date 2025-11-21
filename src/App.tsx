import { useEffect, useMemo, useState } from 'react';
import { useCalculatorStore } from './store';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const keypad = [
  { label: 'C/CE', action: 'clear', tone: 'accent' as const },
  { label: 'OFF', action: 'power', tone: 'muted' as const },
  { label: 'MRC', action: 'mrc', tone: 'muted' as const },
  { label: '%', action: 'percent', tone: 'muted' as const },
  { label: 'M-', action: 'mminus', tone: 'muted' as const },
  { label: 'M+', action: 'mplus', tone: 'muted' as const },
  { label: '÷', action: 'divide', tone: 'operator' as const },
  { label: '×', action: 'multiply', tone: 'operator' as const },
  { label: '7', action: '7', tone: 'primary' as const },
  { label: '8', action: '8', tone: 'primary' as const },
  { label: '9', action: '9', tone: 'primary' as const },
  { label: '-', action: 'subtract', tone: 'operator' as const },
  { label: '4', action: '4', tone: 'primary' as const },
  { label: '5', action: '5', tone: 'primary' as const },
  { label: '6', action: '6', tone: 'primary' as const },
  { label: '+', action: 'add', tone: 'operator' as const },
  { label: '1', action: '1', tone: 'primary' as const },
  { label: '2', action: '2', tone: 'primary' as const },
  { label: '3', action: '3', tone: 'primary' as const },
  { label: '=', action: 'equals', tone: 'operator' as const },
  { label: '0', action: '0', tone: 'primary' as const, span: 2 },
  { label: '.', action: 'decimal', tone: 'primary' as const },
  { label: '+/-', action: 'sign', tone: 'primary' as const },
];

function App() {
  const {
    display,
    inputDigit,
    inputDecimal,
    clearEntry,
    togglePower,
    setOperator,
    evaluate,
    toggleSign,
    percent,
    memoryAdd,
    memorySubtract,
    memoryRecallOrClear,
    poweredOff,
  } = useCalculatorStore();

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

  const handleAction = (action: string) => {
    if (poweredOff && action !== 'power' && action !== 'clear') return;

    switch (action) {
      case 'clear':
        clearEntry();
        break;
      case 'power':
        togglePower();
        break;
      case 'mrc':
        memoryRecallOrClear();
        break;
      case 'mminus':
        memorySubtract();
        break;
      case 'mplus':
        memoryAdd();
        break;
      case 'percent':
        percent();
        break;
      case 'divide':
        setOperator('÷');
        break;
      case 'multiply':
        setOperator('×');
        break;
      case 'subtract':
        setOperator('-');
        break;
      case 'add':
        setOperator('+');
        break;
      case 'equals':
        evaluate();
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'sign':
        toggleSign();
        break;
      default:
        if (/^\d$/.test(action)) {
          inputDigit(action);
        }
    }
  };

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
          <Calculator poweredOff={poweredOff} display={display} onPress={handleAction} />

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

function Calculator({
  display,
  onPress,
  poweredOff,
}: {
  display: string;
  poweredOff: boolean;
  onPress: (action: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[32px] p-5 shadow-2xl border border-slate-900/50">
        <div className="flex items-center justify-between text-slate-200 text-xs font-semibold pb-2 px-1">
          <div>
            <p className="text-sm font-bold">ET-002</p>
            <p className="text-[11px] tracking-wide text-slate-300/80">AUTO POWER OFF</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
            <span>MCP wired</span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-xl p-3 shadow-inner border border-slate-300/70 mb-4">
          <div className="bg-[#d9e0d0] rounded-lg px-3 py-2 border border-slate-400/70 shadow-inner">
            <div
              className={`text-right text-4xl font-semibold tracking-widest text-[#1f2937] font-[Orbitron] ${poweredOff ? 'opacity-40' : ''}`}
            >
              {poweredOff ? '' : display}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 px-1">
          {keypad.map((key) => (
            <button
              key={key.label}
              onClick={() => onPress(key.action)}
              className={getButtonClass(key.tone, key.span)}
              style={key.span ? { gridColumn: `span ${key.span} / span ${key.span}` } : undefined}
            >
              {key.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const getButtonClass = (tone: 'primary' | 'operator' | 'accent' | 'muted', span?: number) => {
  const base =
    'h-14 rounded-xl text-lg font-bold tracking-wide shadow-lg shadow-black/20 border active:scale-95 transition-transform duration-100 focus:outline-none';
  const tones: Record<'primary' | 'operator' | 'accent' | 'muted', string> = {
    primary: 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200',
    operator: 'bg-[#31a4ef] text-white border-[#0b7cc2] hover:bg-[#2797e1]',
    accent: 'bg-orange-400 text-white border-orange-500 hover:bg-orange-500',
    muted: 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600',
  };

  return `${base} ${tones[tone]} ${span ? 'col-span-2' : ''}`;
};

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
