#!/usr/bin/env bun
/**
 * Manual test script for mockLLM
 * Run with: bun tests/manual-test.ts
 */

import { getMockResponse } from '../src/mockLLM';
import type { KeyId } from '@calculator/shared-types';

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface TestCase {
  name: string;
  input: string;
  expectedKeys?: KeyId[];
  shouldContainOps?: KeyId[];
  shouldHaveKeysCount?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Problem statement: "hundred plus 2 divide by 3"',
    input: 'I want to know how much it would be hundred plus 2 divide by 3',
    expectedKeys: [
      'digit_1', 'digit_0', 'digit_0', // 100
      'add',
      'digit_2', // 2
      'div',
      'digit_3', // 3
      'equals'
    ]
  },
  {
    name: 'Simple addition',
    input: 'add 5 and 3',
    expectedKeys: ['digit_5', 'add', 'digit_3', 'equals']
  },
  {
    name: 'Simple subtraction',
    input: 'subtract 7 from 20',
    shouldContainOps: ['sub', 'equals']
  },
  {
    name: 'Simple multiplication',
    input: 'multiply 12 by 4',
    shouldContainOps: ['mul', 'equals']
  },
  {
    name: 'Simple division',
    input: 'divide 100 by 5',
    shouldContainOps: ['div', 'equals']
  },
  {
    name: 'Multiple operations with digits',
    input: '5 plus 10 times 2',
    shouldContainOps: ['add', 'mul', 'equals'],
    shouldHaveKeysCount: 7 // digit_5, add, digit_1, digit_0, mul, digit_2, equals = 7 keys
  },
  {
    name: 'Three operations',
    input: '100 plus 50 minus 30 times 2',
    shouldContainOps: ['add', 'sub', 'mul', 'equals']
  }
];

function arraysEqual(a: any[], b: any[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function runTests(): void {
  console.log('🧪 Running mockLLM tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`${YELLOW}Test: ${test.name}${RESET}`);
    console.log(`  Input: "${test.input}"`);
    
    const result = getMockResponse(test.input);
    console.log(`  Response: "${result.text}"`);
    console.log(`  Keys: [${result.keys?.join(', ') || 'none'}]`);
    
    let testPassed = true;
    
    // Check expected keys
    if (test.expectedKeys) {
      if (!result.keys || !arraysEqual(result.keys, test.expectedKeys)) {
        console.log(`  ${RED}✗ Expected keys: [${test.expectedKeys.join(', ')}]${RESET}`);
        testPassed = false;
      } else {
        console.log(`  ${GREEN}✓ Keys match expected${RESET}`);
      }
    }
    
    // Check if contains specific operations
    if (test.shouldContainOps && result.keys) {
      for (const op of test.shouldContainOps) {
        if (!result.keys.includes(op)) {
          console.log(`  ${RED}✗ Expected to contain operation: ${op}${RESET}`);
          testPassed = false;
        }
      }
      if (testPassed) {
        console.log(`  ${GREEN}✓ Contains expected operations${RESET}`);
      }
    }
    
    // Check key count
    if (test.shouldHaveKeysCount !== undefined) {
      if (!result.keys || result.keys.length !== test.shouldHaveKeysCount) {
        console.log(`  ${RED}✗ Expected ${test.shouldHaveKeysCount} keys, got ${result.keys?.length || 0}${RESET}`);
        testPassed = false;
      } else {
        console.log(`  ${GREEN}✓ Key count matches${RESET}`);
      }
    }
    
    if (testPassed) {
      console.log(`${GREEN}✓ PASSED${RESET}\n`);
      passed++;
    } else {
      console.log(`${RED}✗ FAILED${RESET}\n`);
      failed++;
    }
  }
  
  console.log('━'.repeat(50));
  console.log(`Total: ${testCases.length} tests`);
  console.log(`${GREEN}Passed: ${passed}${RESET}`);
  console.log(`${RED}Failed: ${failed}${RESET}`);
  
  if (failed === 0) {
    console.log(`\n${GREEN}🎉 All tests passed!${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${RED}❌ Some tests failed${RESET}`);
    process.exit(1);
  }
}

runTests();
