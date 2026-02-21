import { describe, expect, it } from 'vitest';
import { getStanceChipColor, normalizeStanceKey } from './stance';

describe('stance helpers', () => {
  it('normalizes stance keys', () => {
    expect(normalizeStanceKey(' Mixed ')).toBe('mixed');
  });

  it('maps stance to chip colors', () => {
    expect(getStanceChipColor('supports')).toBe('green-darken-1');
    expect(getStanceChipColor('opposes')).toBe('red-darken-1');
    expect(getStanceChipColor('mixed')).toBe('amber-darken-1');
    expect(getStanceChipColor('irrelevant')).toBe('blue-grey-darken-1');
    expect(getStanceChipColor('unknown')).toBe('gray');
  });
});
