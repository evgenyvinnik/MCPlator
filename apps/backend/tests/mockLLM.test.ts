import { getMockResponse } from '../src/mockLLM';
import type { KeyId } from '@calculator/shared-types';

/**
 * Test suite for mockLLM compound operation handling
 */

describe('mockLLM', () => {
  describe('compound operations', () => {
    it('should handle "hundred plus 2 divide by 3"', () => {
      const input = 'I want to know how much it would be hundred plus 2 divide by 3';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('calculate');
      expect(result.text).toContain('The result is 34');
      expect(result.keys).toBeDefined();
      
      const expectedKeys: KeyId[] = [
        'digit_1', 'digit_0', 'digit_0', // 100
        'add',
        'digit_2', // 2
        'div',
        'digit_3', // 3
        'equals'
      ];
      
      expect(result.keys).toEqual(expectedKeys);
    });

    it('should handle multiple operations with digit numbers', () => {
      const input = '5 plus 10 times 2';
      const result = getMockResponse(input);
      
      expect(result.keys).toBeDefined();
      expect(result.keys).toContain('add');
      expect(result.keys).toContain('mul');
      expect(result.keys).toContain('equals');
    });

    it('should handle three operations', () => {
      const input = '100 plus 50 minus 30 times 2';
      const result = getMockResponse(input);
      
      expect(result.keys).toBeDefined();
      expect(result.keys?.length).toBeGreaterThan(10); // Should have multiple operations
    });
  });

  describe('simple operations', () => {
    it('should still handle simple addition', () => {
      const input = 'add 5 and 3';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('add');
      expect(result.keys).toEqual([
        'digit_5',
        'add',
        'digit_3',
        'equals'
      ]);
    });

    it('should handle simple subtraction', () => {
      const input = 'subtract 7 from 20';
      const result = getMockResponse(input);
      
      expect(result.keys).toContain('sub');
    });

    it('should handle simple multiplication', () => {
      const input = 'multiply 12 by 4';
      const result = getMockResponse(input);
      
      expect(result.keys).toContain('mul');
    });

    it('should handle simple division', () => {
      const input = 'divide 100 by 5';
      const result = getMockResponse(input);
      
      expect(result.keys).toContain('div');
    });
  });

  describe('edge cases', () => {
    it('should handle mixed word and digit numbers', () => {
      const input = 'hundred plus 2 divide by 3';
      const result = getMockResponse(input);
      
      expect(result.keys).toBeDefined();
      // Should extract 100, 2, 3 in that order
      expect(result.keys?.[0]).toBe('digit_1');
      expect(result.keys?.[1]).toBe('digit_0');
      expect(result.keys?.[2]).toBe('digit_0');
    });

    it('should return default message for unrecognized input', () => {
      const input = 'hello world';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('mock calculator assistant');
      expect(result.keys).toBeUndefined();
    });
  });

  describe('input validation', () => {
    it('should handle empty input', () => {
      const result = getMockResponse('');
      expect(result.text).toContain('Please provide a calculation request');
      expect(result.keys).toBeUndefined();
    });

    it('should handle whitespace-only input', () => {
      const result = getMockResponse('   ');
      expect(result.text).toContain('Please provide a calculation request');
      expect(result.keys).toBeUndefined();
    });

    it('should handle very long input', () => {
      const longInput = 'a'.repeat(501);
      const result = getMockResponse(longInput);
      expect(result.text).toContain('too long');
      expect(result.keys).toBeUndefined();
    });
  });

  describe('enhanced LLM capabilities', () => {
    describe('square root operations', () => {
      it('should handle square root with "square root of"', () => {
        const input = 'square root of 16';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('square root of 16');
        expect(result.text).toContain('The result is 4');
        expect(result.keys).toContain('sqrt');
      });

      it('should handle square root with "sqrt"', () => {
        const input = 'sqrt 25';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('square root of 25');
        expect(result.text).toContain('The result is 5');
        expect(result.keys).toContain('sqrt');
      });

      it('should handle square root of decimal', () => {
        const input = 'square root of 2.25';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('square root of 2.25');
        expect(result.text).toContain('The result is 1.5');
        expect(result.keys).toContain('sqrt');
      });

      it('should reject square root of negative number', () => {
        const input = 'square root of -16';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('cannot calculate the square root of a negative number');
        expect(result.keys).toBeUndefined();
      });
    });

    describe('sign change operations', () => {
      it('should handle "change sign"', () => {
        const input = 'change sign of 5';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('change the sign of 5 to -5');
        expect(result.keys).toContain('plus_minus');
      });

      it('should handle "negate"', () => {
        const input = 'negate 10';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('change the sign of 10 to -10');
        expect(result.keys).toContain('plus_minus');
      });

      it('should handle "make negative"', () => {
        const input = 'make 7 negative';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('change the sign');
        expect(result.keys).toContain('plus_minus');
      });
    });

    describe('clear operations', () => {
      it('should handle "clear all"', () => {
        const input = 'clear all';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('clear the calculator completely');
        expect(result.keys).toEqual(['ac']);
      });

      it('should handle "reset"', () => {
        const input = 'reset';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('clear the calculator completely');
        expect(result.keys).toEqual(['ac']);
      });

      it('should handle "clear entry"', () => {
        const input = 'clear entry';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('clear the current entry');
        expect(result.keys).toEqual(['c']);
      });

      it('should handle "clear" alone as clear entry', () => {
        const input = 'clear';
        const result = getMockResponse(input);
        
        expect(result.text).toContain('clear the current entry');
        expect(result.keys).toEqual(['c']);
      });
    });

    describe('memory operations', () => {
      it('should handle memory add with value', () => {
        const input = 'add 42 to memory';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("add 42 to memory");
        expect(result.keys).toContain('m_plus');
        expect(result.keys).toContain('digit_4');
        expect(result.keys).toContain('digit_2');
      });

      it('should handle memory store', () => {
        const input = 'store 100 in memory';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("add 100 to memory");
        expect(result.keys).toContain('m_plus');
      });

      it('should handle memory subtract', () => {
        const input = 'subtract 10 from memory';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("subtract 10 from memory");
        expect(result.keys).toContain('m_minus');
      });

      it('should handle memory recall', () => {
        const input = 'recall memory';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("recall the value from memory");
        expect(result.keys).toEqual(['mr']);
      });

      it('should handle memory clear', () => {
        const input = 'clear memory';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("clear the calculator's memory");
        expect(result.keys).toEqual(['mc']);
      });

      it('should handle M+ notation', () => {
        const input = 'm plus';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("memory");
        expect(result.keys).toEqual(['m_plus']);
      });

      it('should handle M- notation', () => {
        const input = 'm minus';
        const result = getMockResponse(input);
        
        expect(result.text).toContain("memory");
        expect(result.keys).toEqual(['m_minus']);
      });

      it('should handle MR notation', () => {
        const input = 'mr';
        const result = getMockResponse(input);
        
        expect(result.keys).toEqual(['mr']);
      });

      it('should handle MC notation', () => {
        const input = 'mc';
        const result = getMockResponse(input);
        
        expect(result.keys).toEqual(['mc']);
      });
    });
  });

  describe('error handling', () => {
    it('should reject division by zero', () => {
      const input = 'divide 10 by 0';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('cannot divide');
      expect(result.text).toContain('by zero');
      expect(result.keys).toBeUndefined();
    });

    it('should handle missing numbers in addition', () => {
      const input = 'add something';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('need two numbers');
      expect(result.keys).toBeUndefined();
    });

    it('should handle missing numbers in subtraction', () => {
      const input = 'subtract';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('need two numbers');
      expect(result.keys).toBeUndefined();
    });

    it('should handle missing numbers in multiplication', () => {
      const input = 'multiply';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('need two numbers');
      expect(result.keys).toBeUndefined();
    });

    it('should handle missing numbers in division', () => {
      const input = 'divide';
      const result = getMockResponse(input);
      
      expect(result.text).toContain('need two numbers');
      expect(result.keys).toBeUndefined();
    });
  });

  describe('percentage operations', () => {
    it('should handle percentage calculation', () => {
      const input = '25 percent';
      const result = getMockResponse(input);
      
      expect(result.text).toContain("calculate 25%");
      expect(result.keys).toContain('percent');
    });

    it('should handle percentage with % symbol', () => {
      const input = 'what is 50%';
      const result = getMockResponse(input);
      
      expect(result.text).toContain("50%");
      expect(result.keys).toContain('percent');
    });
  });
});
