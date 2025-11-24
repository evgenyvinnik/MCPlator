import { CalculatorSurface } from './components/CalculatorSurface';
import { ChatPanel } from './components/ChatPanel';
import { useAnimationRunner } from './hooks/useAnimationRunner';

function App() {
  useAnimationRunner();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 h-[800px] md:h-[600px]">
        <div className="flex items-center justify-center">
          <CalculatorSurface />
        </div>
        <div className="h-full">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
