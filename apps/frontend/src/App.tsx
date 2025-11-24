import { ChatPanel } from './components/ChatPanel';
import { useAnimationRunner } from './hooks/useAnimationRunner';
import RetroCalculator from './components/RetroCalculator';

function App() {
  useAnimationRunner();

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#05060f] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(102,76,255,0.35),transparent_55%)] blur-3xl" />
        <div className="absolute right-[-8%] -top-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,223,255,0.25),transparent_55%)] blur-3xl" />
        <div className="absolute left-[36%] bottom-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(94,255,199,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:140px_140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
            <span className="text-lg font-semibold tracking-tight text-cyan-200">MC</span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-300">MCPlator Labs</p>
            <p className="text-xl font-display font-semibold text-white">Analog precision, AI intuition.</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 text-xs font-mono text-slate-300 md:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Realtime math</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">LLM guidance</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Glass UI</span>
        </div>
      </header>

      <main className="relative z-10 flex h-[calc(100vh-120px)] gap-8 px-8 pb-10">
        <div className="flex-1 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Co-process with the calculator
            </span>
            <h1 className="text-4xl font-display font-semibold leading-tight text-white md:text-5xl">
              The retro calculator now ships with a neural co-pilot.
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              Drop your steps, let the Codex-style chat orchestrate the keystrokes, and watch the classic Casio keep up with future-grade reasoning.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-emerald-500/10">
                <p className="font-mono text-xs text-emerald-300">Signal</p>
                <p className="font-semibold">Verified keypress stream</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-cyan-500/10">
                <p className="font-mono text-xs text-cyan-300">LLM</p>
                <p className="font-semibold">Context-aware math agent</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-6 rounded-[30px] bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-3xl" />
            <div className="absolute -inset-1 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl" />
            <div className="relative">
              <RetroCalculator />
            </div>
          </div>
        </div>

        <div className="h-full w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(11,16,33,0.8)] shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <ChatPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
