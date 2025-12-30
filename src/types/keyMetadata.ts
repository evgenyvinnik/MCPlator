/**
 * @fileoverview Centralized key metadata for the calculator.
 *
 * This module provides a single source of truth for all key-related
 * definitions including labels, categories, and mappings between
 * different key identifier systems.
 *
 * @module types/keyMetadata
 */

import type { KeyId } from './calculator';

/**
 * Categories for calculator keys.
 */
export type KeyCategory =
  | 'NUMBER'
  | 'OPERATOR'
  | 'MEMORY'
  | 'FUNCTION'
  | 'CONTROL';

/**
 * Metadata for a calculator key.
 */
export interface KeyMetadata {
  /** Display label shown on the button */
  label: string;
  /** Category of the key */
  category: KeyCategory;
}

/**
 * Centralized metadata for all calculator keys.
 * Single source of truth for labels and categories.
 */
export const KEY_METADATA: Record<KeyId, KeyMetadata> = {
  // Number keys
  digit_0: { label: '0', category: 'NUMBER' },
  digit_1: { label: '1', category: 'NUMBER' },
  digit_2: { label: '2', category: 'NUMBER' },
  digit_3: { label: '3', category: 'NUMBER' },
  digit_4: { label: '4', category: 'NUMBER' },
  digit_5: { label: '5', category: 'NUMBER' },
  digit_6: { label: '6', category: 'NUMBER' },
  digit_7: { label: '7', category: 'NUMBER' },
  digit_8: { label: '8', category: 'NUMBER' },
  digit_9: { label: '9', category: 'NUMBER' },

  // Decimal point
  decimal: { label: '.', category: 'NUMBER' },

  // Arithmetic operators (using consistent Unicode symbols)
  add: { label: '+', category: 'OPERATOR' },
  sub: { label: '−', category: 'OPERATOR' }, // Unicode minus U+2212
  mul: { label: '×', category: 'OPERATOR' }, // Unicode multiplication sign
  div: { label: '÷', category: 'OPERATOR' }, // Unicode division sign

  // Special functions
  percent: { label: '%', category: 'FUNCTION' },
  sqrt: { label: '√', category: 'FUNCTION' },
  plus_minus: { label: '±', category: 'FUNCTION' },

  // Control keys
  equals: { label: '=', category: 'CONTROL' },
  ac: { label: 'AC', category: 'CONTROL' },
  c: { label: 'C', category: 'CONTROL' },

  // Memory operations
  mc: { label: 'MC', category: 'MEMORY' },
  mr: { label: 'MR', category: 'MEMORY' },
  m_plus: { label: 'M+', category: 'MEMORY' },
  m_minus: { label: 'M−', category: 'MEMORY' }, // Unicode minus for consistency
};

/**
 * Convenience mapping from KeyId to display label.
 * Use this when you only need the label string.
 */
export const KEY_LABELS: Record<KeyId, string> = Object.fromEntries(
  Object.entries(KEY_METADATA).map(([k, v]) => [k, v.label])
) as Record<KeyId, string>;

/**
 * Internal button identifiers used by RetroKeypad.
 * These map to the physical button layout of the Casio SL-300SV.
 */
export type RetroKeyValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'float'
  | 'plus'
  | 'minus'
  | 'multiply'
  | 'divide'
  | 'perform'
  | 'on'
  | 'clear'
  | 'off'
  | 'percentage'
  | 'change_sign'
  | 'sqrt'
  | 'mc'
  | 'mr'
  | 'm+'
  | 'm-';

/**
 * Maps RetroKeypad button values to calculator engine KeyId values.
 *
 * The keypad uses human-readable values (e.g., 'plus', 'multiply')
 * while the calculator engine uses normalized KeyIds (e.g., 'add', 'mul').
 *
 * Note: 'off' is intentionally not mapped - it's a UI-only control
 * that turns off the display without triggering any calculator operation.
 */
export const RETRO_KEY_TO_KEY_ID: Partial<Record<RetroKeyValue, KeyId>> = {
  // Number keys
  '0': 'digit_0',
  '1': 'digit_1',
  '2': 'digit_2',
  '3': 'digit_3',
  '4': 'digit_4',
  '5': 'digit_5',
  '6': 'digit_6',
  '7': 'digit_7',
  '8': 'digit_8',
  '9': 'digit_9',
  // Decimal point
  float: 'decimal',
  // Arithmetic operations
  plus: 'add',
  minus: 'sub',
  multiply: 'mul',
  divide: 'div',
  // Equals
  perform: 'equals',
  // Clear functions
  on: 'ac',
  clear: 'c',
  // Special functions
  percentage: 'percent',
  change_sign: 'plus_minus',
  sqrt: 'sqrt',
};

/**
 * Maps calculator engine KeyIds to RetroKeypad button identifiers.
 * Used to trigger visual button presses during AI-driven animations.
 */
export const KEY_ID_TO_RETRO_KEY: Partial<Record<KeyId, RetroKeyValue>> = {
  digit_0: '0',
  digit_1: '1',
  digit_2: '2',
  digit_3: '3',
  digit_4: '4',
  digit_5: '5',
  digit_6: '6',
  digit_7: '7',
  digit_8: '8',
  digit_9: '9',
  decimal: 'float',
  add: 'plus',
  sub: 'minus',
  mul: 'multiply',
  div: 'divide',
  percent: 'percentage',
  equals: 'perform',
  ac: 'on',
  c: 'clear',
  mc: 'mc',
  mr: 'mr',
  m_plus: 'm+',
  m_minus: 'm-',
  plus_minus: 'change_sign',
  // Note: 'sqrt' maps to itself (not in this mapping as it's the same)
};

/**
 * Maps memory button values to KeyIds.
 * Memory buttons in RetroKeypad use 'value' property differently.
 */
export const MEMORY_KEY_MAP: Record<string, KeyId> = {
  clear: 'mc',
  recall: 'mr',
  plus: 'm_plus',
  minus: 'm_minus',
};
