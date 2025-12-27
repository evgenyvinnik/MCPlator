import { useEffect, useState } from 'react';
import { AIChatPanel } from './components/AIChatPanel';
import { useAnimationRunner } from './hooks/useAnimationRunner';
import RetroCalculator from './components/RetroCalculator';
import { useCalculatorStore } from './state/useCalculatorStore';
import { useChatStore } from './state/useChatStore';
import styles from './App.module.css';
import { MessageSquare } from 'lucide-react';

function App() {
  useAnimationRunner();
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Initialize isMobile based on window width to avoid flash
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      {/* Mobile Chat Toggle Button - needs higher z-index than everything else */}
      {isMobile && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(to bottom right, #22d3ee, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="relative z-10 flex h-full">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {!isMobile && (
            <header className="flex items-center justify-between px-10 py-8">
              <div className="hidden items-center gap-3 text-xs font-mono text-slate-300 md:flex">
                <span className="rounded-full border border-[#007acc]/30 bg-gradient-to-r from-[#007acc]/10 to-[#005a9e]/10 px-3 py-1.5 shadow-lg shadow-[#007acc]/10">
                  Realtime math
                </span>
                <span className="rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-1.5 shadow-lg shadow-purple-500/10">
                  LLM guidance
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 shadow-lg shadow-emerald-500/10">
                  Glass UI
                </span>
              </div>
            </header>
          )}

          <main
            className={`flex-1 flex items-center ${isMobile ? 'justify-center px-4' : 'px-8'} pb-8`}
            style={
              isMobile && isChatOpen
                ? { paddingTop: 8, alignItems: 'flex-start' }
                : undefined
            }
          >
            {isMobile ? (
              // Mobile: Just show centered calculator
              <div
                className="relative flex items-center justify-center"
                style={isChatOpen ? { marginTop: 8 } : undefined}
              >
                <div className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-pink-500/10 blur-3xl opacity-80" />
                <div className="absolute -inset-4 rounded-[30px] bg-gradient-to-br from-[#007acc]/10 via-purple-500/10 to-emerald-500/10 blur-2xl" />
                <div
                  className={`${styles.retroCalculatorContainer} relative isolate z-10`}
                >
                  <RetroCalculator />
                </div>
              </div>
            ) : (
              // Desktop: Original two-column layout
              <div className="flex-1 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-xl space-y-6">
                  <h1 className="text-4xl font-display font-bold leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent md:text-5xl">
                    The retro calculator now ships with a neural co-pilot.
                  </h1>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-pink-500/10 blur-3xl opacity-80" />
                  <div className="absolute -inset-4 rounded-[30px] bg-gradient-to-br from-[#007acc]/10 via-purple-500/10 to-emerald-500/10 blur-2xl" />
                  <div
                    className={`${styles.retroCalculatorContainer} relative isolate z-10`}
                  >
                    <RetroCalculator />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Chat panel - Desktop: sidebar (unchanged), Mobile: overlay */}
        {!isMobile && (
          // Desktop: Original sidebar layout
          <div className="h-full w-[400px] flex-shrink-0">
            <AIChatPanel />
          </div>
        )}
      </div>

      {/* Mobile: Bottom sheet overlay covering 75% of screen */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: '75vh',
            zIndex: 100,
            transform: isChatOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 300ms ease-in-out',
          }}
        >
          <AIChatPanel
            isMobile={true}
            onToggle={() => setIsChatOpen(false)}
            onOpen={() => setIsChatOpen(true)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
