import { describe, expect, it } from 'vitest';
import { formatNumber, levelLabel } from './format';

describe('format helpers', () => {
  it('formats small numbers with locale separators', () => {
    expect(formatNumber(1280)).toBe('1,280');
  });

  it('formats large numbers using w suffix', () => {
    expect(formatNumber(25600)).toBe('2.6w');
  });

  it('maps viral levels to readable labels', () => {
    expect(levelLabel('VIRAL')).toBe('爆款');
    expect(levelLabel('POTENTIAL')).toBe('潜力');
    expect(levelLabel('NORMAL')).toBe('普通');
  });
});
