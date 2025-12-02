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
});
