import { useCalculatorStore } from './store';

function App() {
  const { count, increment, decrement, reset } = useCalculatorStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-600">
          MCPlator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          React + Vite + Tailwind + Zustand + TypeScript
        </p>

        <div className="bg-gray-100 rounded-lg p-8 mb-8">
          <div className="text-6xl font-bold text-center text-gray-800">
            {count}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={increment}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Increment (+)
          </button>
          <button
            onClick={decrement}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Decrement (-)
          </button>
          <button
            onClick={reset}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Reset
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>State managed with Zustand</p>
          <p>Styled with Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

export default App;
