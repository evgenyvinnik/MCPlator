import { ChatPanel } from './components/ChatPanel';
import { useAnimationRunner } from './hooks/useAnimationRunner';
import RetroCalculator from './components/RetroCalculator';

function App() {
  useAnimationRunner();

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <RetroCalculator />
      </div>
      <div className="w-[400px] h-full border-l border-white/10 bg-[#1a102e]/50 backdrop-blur-xl">
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
