# Calculator Engine

This package contains the core calculator logic for the MCPlator application. It implements a Casio-style calculator with full support for basic arithmetic operations, memory functions, and percentage calculations.

## Features

### Basic Operations

- **Digit Entry (0-9)**: Enter numbers up to 8 digits
- **Decimal Point**: Support for decimal numbers
- **Arithmetic Operations**: Addition (+), Subtraction (-), Multiplication (×), Division (÷)
- **Equals (=)**: Complete the current operation

### Advanced Features

- **Memory Operations**: M+, M-, MR, MC
- **Percentage Calculations**: Context-aware percentage calculations
- **Clear Operations**: AC (All Clear), C (Clear entry)
- **Error Handling**: Division by zero, overflow detection

### Operation Behavior

#### Left-to-Right Processing

The calculator processes operations from left to right, similar to many basic calculators. It does **not** follow PEMDAS/BODMAS order of operations.

Example:

```
5 + 3 × 2 = ?
Step 1: 5 + 3 = 8
Step 2: 8 × 2 = 16
Result: 16 (not 11 as PEMDAS would give)
```

#### Chained Operations

You can chain multiple operations without pressing equals:

```
100 + 2 ÷ 3 = ?
Step 1: 100 + 2 = 102
Step 2: 102 ÷ 3 = 34
Result: 34
```

#### Display Formatting

- Maximum 8 characters including decimal point and sign
- Scientific notation for very large or very small numbers
- Trailing zeros removed from decimals

## Usage

```typescript
import { calculatorEngine } from '@calculator/calculator-engine';

// Initialize the calculator
let state = calculatorEngine.initialState();

// Press keys
state = calculatorEngine.pressKey(state, 'digit_5');
state = calculatorEngine.pressKey(state, 'add');
state = calculatorEngine.pressKey(state, 'digit_3');
state = calculatorEngine.pressKey(state, 'equals');

// Get the display
const display = calculatorEngine.toDisplay(state);
console.log(display.text); // "8"
```

## API

### calculatorEngine.initialState()

Returns the initial calculator state.

```typescript
const state = calculatorEngine.initialState();
```

### calculatorEngine.pressKey(state, key)

Processes a key press and returns the new state.

```typescript
const newState = calculatorEngine.pressKey(state, 'digit_5');
```

**Key IDs:**

- Digits: `'digit_0'` through `'digit_9'`
- Operations: `'add'`, `'sub'`, `'mul'`, `'div'`
- Control: `'equals'`, `'ac'`, `'c'`, `'decimal'`, `'percent'`
- Memory: `'mc'`, `'mr'`, `'m_plus'`, `'m_minus'`

### calculatorEngine.toDisplay(state)

Converts the internal state to a display representation.

```typescript
const display = calculatorEngine.toDisplay(state);
console.log(display.text); // e.g., "42"
console.log(display.indicators.memory); // true if memory is active
```

## Internal State

The calculator maintains the following state:

```typescript
type CalculatorInternalState = {
  displayValue: string; // Current display value
  memoryValue: number; // Value stored in memory
  hasMemory: boolean; // Whether memory contains a value
  constant: null | {
    // Constant for repeated equals
    operator: 'add' | 'sub' | 'mul' | 'div';
    value: number;
  };
  lastOperator: 'add' | 'sub' | 'mul' | 'div' | null;
  lastOperand: number | null; // Left operand of pending operation
  isError: boolean; // Error state (division by zero, etc.)
  shouldStartNewNumber: boolean; // Whether next digit starts a new number
};
```

## Operation Details

### Percentage Calculations

The percentage key (`%`) behaves differently based on context:

1. **Standalone**: Divides by 100

   ```
   50 % = 0.5
   ```

2. **With Addition/Subtraction**: Calculates percentage of first operand

   ```
   100 + 10 % = displays "10" (10% of 100)
   100 - 20 % = displays "20" (20% of 100)
   ```

3. **With Multiplication/Division**: Converts to percentage
   ```
   100 × 10 % = displays "0.1" (10% as decimal)
   ```

### Memory Operations

- **M+**: Add current display value to memory
- **M-**: Subtract current display value from memory
- **MR**: Recall memory value to display
- **MC**: Clear memory

Memory accumulates values:

```
5 M+    → memory = 5
3 M+    → memory = 8
10 M-   → memory = -2
MR      → display = -2
MC      → memory = 0
```

### Clear Operations

- **C (Clear)**: Clear the current display value only
- **AC (All Clear)**: Clear display and all pending operations

## Error Handling

The calculator handles the following error conditions:

1. **Division by Zero**: Displays "E" and sets error flag
2. **Overflow**: Very large numbers use scientific notation
3. **Underflow**: Very small numbers use scientific notation

In error state, only AC can clear the error. All other keys are ignored.

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes 39 comprehensive tests covering:

- Basic arithmetic operations
- Digit entry and decimal handling
- Clear operations
- Percentage calculations
- Memory operations
- Chained operations
- Error handling
- Display formatting
- Edge cases

## Examples

### Simple Addition

```typescript
let state = calculatorEngine.initialState();
state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'equals']);
// Display: "8"
```

### Chained Operations

```typescript
let state = calculatorEngine.initialState();
state = pressKeys(state, [
  'digit_5',
  'add',
  'digit_3',
  'mul',
  'digit_2',
  'equals',
]);
// Display: "16" (5 + 3 = 8, then 8 × 2 = 16)
```

### Memory Usage

```typescript
let state = calculatorEngine.initialState();
state = pressKeys(state, ['digit_5', 'm_plus', 'digit_3', 'm_plus', 'mr']);
// Display: "8" (5 + 3 in memory)
```

### Percentage Calculation

```typescript
let state = calculatorEngine.initialState();
state = pressKeys(state, [
  'digit_1',
  'digit_0',
  'digit_0',
  'add',
  'digit_1',
  'digit_0',
  'percent',
]);
// Display: "10" (10% of 100)
```

## Implementation Notes

- The calculator uses a `shouldStartNewNumber` flag to determine when to start a fresh number entry vs. appending to the current display
- Operations are executed immediately when chaining (not waiting for equals)
- The `lastOperand` stores the left operand of a pending operation
- Display formatting ensures results fit within the 8-character limit
- All arithmetic uses JavaScript's number type (IEEE 754 double precision)
