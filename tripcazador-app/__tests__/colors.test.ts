import { Colors } from '../src/constants/colors';

describe('Brand colors (sync with web tailwind + brand PDF)', () => {
  it('amber brand color is #f59e0b', () => {
    expect(Colors.amber).toBe('#f59e0b');
  });
  it('dark background is gray-950 #030712', () => {
    expect(Colors.bg).toBe('#030712');
  });
  it('surface is gray-900 #111827', () => {
    expect(Colors.surface).toBe('#111827');
  });
  it('success is emerald-500', () => {
    expect(Colors.success).toBe('#10b981');
  });
  it('all colors are valid hex or rgba', () => {
    const hexOrRgba = /^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/;
    for (const [key, value] of Object.entries(Colors)) {
      expect(value).toMatch(hexOrRgba);
      expect(typeof key).toBe('string');
    }
  });
});
