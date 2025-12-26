import { useEffect } from 'react';
import { AIChatPanel } from './components/AIChatPanel';
import { useAnimationRunner } from './hooks/useAnimationRunner';
import RetroCalculator from './components/RetroCalculator';
import { useCalculatorStore } from './state/useCalculatorStore';
import { useChatStore } from './state/useChatStore';
import styles from './App.module.css';

function App() {
  useAnimationRunner();

  // Hydrate stores from IndexedDB on mount
  useEffect(() => {
    useCalculatorStore.getState().hydrate();
    useChatStore.getState().hydrate();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#1a1f35] to-[#0f1629] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[32rem] w-[32rem] animate-pulse rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.4),transparent_60%)] blur-3xl [animation-duration:8s]" />
        <div className="absolute right-[-10%] -top-16 h-[36rem] w-[36rem] animate-pulse rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35),transparent_60%)] blur-3xl [animation-delay:2s] [animation-duration:10s]" />
        <div className="absolute left-[30%] bottom-[-16rem] h-[32rem] w-[32rem] animate-pulse rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3),transparent_65%)] blur-3xl [animation-delay:4s] [animation-duration:12s]" />
        <div className="absolute right-[20%] top-[40%] h-[28rem] w-[28rem] animate-pulse rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25),transparent_65%)] blur-3xl [animation-delay:1s] [animation-duration:9s]" />
        <div className="absolute left-[60%] top-[20%] h-[24rem] w-[24rem] animate-pulse rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent_65%)] blur-3xl [animation-delay:3s] [animation-duration:11s]" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(120deg,rgba(139,92,246,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/50 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-10 py-8">
            <div className="hidden items-center gap-3 text-xs font-mono text-slate-300 md:flex">
              <span className="rounded-full border border-[#007acc]/30 bg-gradient-to-r from-[#007acc]/10 to-[#005a9e]/10 px-3 py-1.5 shadow-lg shadow-[#007acc]/10">Realtime math</span>
              <span className="rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-1.5 shadow-lg shadow-purple-500/10">LLM guidance</span>
              <span className="rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 shadow-lg shadow-emerald-500/10">Glass UI</span>
            </div>
          </header>

          <main className="flex-1 flex items-center px-8 pb-8">
            <div className="flex-1 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-xl space-y-6">
                <h1 className="text-4xl font-display font-bold leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent md:text-5xl">
                  The retro calculator now ships with a neural co-pilot.
                </h1>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-pink-500/10 blur-3xl opacity-80" />
                <div className="absolute -inset-4 rounded-[30px] bg-gradient-to-br from-[#007acc]/10 via-purple-500/10 to-emerald-500/10 blur-2xl" />
                <div className={`${styles.retroCalculatorContainer} relative isolate z-10`}>
                  <RetroCalculator />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Chat panel - full height */}
        <div className="h-full w-[400px] flex-shrink-0">
          <AIChatPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
