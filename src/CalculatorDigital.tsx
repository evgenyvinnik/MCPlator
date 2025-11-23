import { useCalculatorStore } from './store';

export default function CalculatorDigital() {
  const {
    display,
    memory,
    poweredOff,
    inputDigit,
    inputDecimal,
    clearEntry,
    allClear,
    togglePower,
    setOperator,
    evaluate,
    toggleSign,
    percent,
    sqrt,
    memoryAdd,
    memorySubtract,
    memoryRecall,
    memoryClear,
  } = useCalculatorStore();

  // Helper to determine if a memory indicator should be shown
  const showMemory = memory !== 0;

  return (
    <div className="flex items-center justify-center p-4">
      {/* Main Body - Silver/Metallic finish */}
      <div className="relative bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 rounded-[30px] p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_40px_rgba(0,0,0,0.4)] w-[360px]">
        
        {/* Branding Area */}
        <div className="flex justify-between items-start mb-6 px-2">
          <div className="text-gray-600 font-bold text-2xl tracking-wider font-sans">CASIO</div>
          <div className="flex flex-col items-end">
            <div className="w-24 h-8 bg-[#2a2a2a] rounded border border-gray-400/50 shadow-inner mb-1"></div>
            <div className="text-[10px] font-bold text-gray-500 tracking-widest">TWO WAY POWER</div>
          </div>
        </div>

        {/* Display Area */}
        <div className="bg-[#3a4a5a] rounded-t-2xl rounded-b-lg p-6 mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border-b border-white/10">
          <div className="bg-[#c5dca0] rounded p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] h-24 relative flex flex-col justify-between font-mono">
            {/* Indicators */}
            <div className="absolute left-2 top-2 flex flex-col gap-1 text-xs font-bold text-black/70">
              <span className={showMemory ? 'opacity-100' : 'opacity-5'}>M</span>
              <span className={display.includes('-') ? 'opacity-100' : 'opacity-0'}>-</span>
              <span className={display.includes('E') || display === 'Err' ? 'opacity-100' : 'opacity-5'}>E</span>
            </div>
            
            {/* Main Digits */}
            <div className="flex justify-end items-end h-full pb-1">
               <span className={`text-6xl font-semibold tracking-tight text-[#1a1a1a] font-[SevenSegment] ${poweredOff ? 'opacity-0' : 'opacity-90'}`} style={{ fontFamily: "'Segment7', monospace" }}>
                {poweredOff ? '' : display.replace('-', '')}
              </span>
            </div>
            
             {/* Tick marks simulation (top of display) */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-[1px] h-1 bg-black/20"></div>
                ))}
             </div>
          </div>
        </div>

        {/* Keypad Area */}
        <div className="space-y-4">
          
          {/* Top Row (Sqrt, OFF) */}
          <div className="flex justify-end gap-4 mb-2">
             <Button label="√" onClick={sqrt} />
             <Button label="OFF" onClick={togglePower} />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-5 gap-3">
            {/* Row 1 */}
            <Button label="MC" onClick={memoryClear} />
            <Button label="MR" onClick={memoryRecall} />
            <Button label="M-" onClick={memorySubtract} />
            <Button label="M+" onClick={memoryAdd} />
            <Button label="÷" onClick={() => setOperator('÷')} />

            {/* Row 2 */}
            <Button label="%" onClick={percent} />
            <Button label="7" onClick={() => inputDigit('7')} />
            <Button label="8" onClick={() => inputDigit('8')} />
            <Button label="9" onClick={() => inputDigit('9')} />
            <Button label="×" onClick={() => setOperator('×')} />

            {/* Row 3 */}
            <Button label="+/-" onClick={toggleSign} labelSmall />
            <Button label="4" onClick={() => inputDigit('4')} />
            <Button label="5" onClick={() => inputDigit('5')} />
            <Button label="6" onClick={() => inputDigit('6')} />
            <Button label="-" onClick={() => setOperator('-')} />

            {/* Row 4 & 5 Wrapper for complex layout */}
            {/* We need to handle the tall + button. 
                Grid is 5 columns. 
                Row 4: C, 1, 2, 3, + (starts here)
                Row 5: AC, 0, ., = (starts here, but + takes the last slot of this row too)
            */}
            
            <Button label="C" onClick={clearEntry} color="red" />
            <Button label="1" onClick={() => inputDigit('1')} />
            <Button label="2" onClick={() => inputDigit('2')} />
            <Button label="3" onClick={() => inputDigit('3')} />
            <Button label="+" onClick={() => setOperator('+')} tall />

            <Button label="AC" onClick={allClear} color="red" />
            <Button label="0" onClick={() => inputDigit('0')} />
            <Button label="." onClick={inputDecimal} />
            <Button label="=" onClick={evaluate} />
            {/* The + button spans down here, so we don't put a 5th button in this row */}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ButtonProps {
  label: string;
  onClick: () => void;
  color?: 'black' | 'red';
  tall?: boolean;
  labelSmall?: boolean;
}

function Button({ label, onClick, color = 'black', tall = false, labelSmall = false }: ButtonProps) {
  const baseStyles = "relative rounded-lg shadow-[0_3px_0_rgba(0,0,0,0.3),0_4px_5px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center border-t border-white/10";
  
  const colorStyles = color === 'red' 
    ? "bg-[#b95d65] text-white" 
    : "bg-[#3a3a3a] text-white";

  const heightStyles = tall ? "h-[116px] row-span-2" : "h-[52px]";
  const fontStyles = labelSmall ? "text-sm font-bold" : "text-xl font-bold";

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${colorStyles} ${heightStyles} ${fontStyles}`}
    >
      {label}
    </button>
  );
}