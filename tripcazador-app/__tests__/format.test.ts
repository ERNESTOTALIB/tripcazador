import { formatEur, formatDateRange, relativeTimeAgo, pluralize, truncate } from '../src/lib/format';

describe('formatEur', () => {
  it('formats integer EUR without decimals by default', () => {
    expect(formatEur(99)).toMatch(/99/);
    expect(formatEur(99)).toMatch(/€/);
  });
  it('supports 2 decimals', () => {
    expect(formatEur(9.99, { decimals: 2 })).toMatch(/9,?\.?99/);
  });
});

describe('formatDateRange', () => {
  it('returns single date for only out', () => {
    expect(formatDateRange('2026-05-20')).toMatch(/may/i);
  });
  it('returns range when same month', () => {
    const result = formatDateRange('2026-05-15', '2026-05-19');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/19/);
  });
  it('returns full range when different month', () => {
    const result = formatDateRange('2026-05-30', '2026-06-03');
    expect(result.length).toBeGreaterThan(8);
  });
  it('handles empty input', () => {
    expect(formatDateRange()).toBe('');
  });
});

describe('relativeTimeAgo', () => {
  it('returns "ahora" for current time', () => {
    expect(relativeTimeAgo(new Date().toISOString())).toBe('ahora');
  });
  it('returns minutes for recent', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(relativeTimeAgo(tenMinAgo)).toMatch(/min/);
  });
  it('returns hours for >60min', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    expect(relativeTimeAgo(twoHoursAgo)).toMatch(/h$/);
  });
});

describe('pluralize', () => {
  it('returns singular for 1', () => {
    expect(pluralize(1, 'noche', 'noches')).toBe('noche');
  });
  it('returns plural for 0', () => {
    expect(pluralize(0, 'noche', 'noches')).toBe('noches');
  });
  it('returns plural for >1', () => {
    expect(pluralize(5, 'noche', 'noches')).toBe('noches');
  });
});

describe('truncate', () => {
  it('returns string unchanged when short enough', () => {
    expect(truncate('hola', 10)).toBe('hola');
  });
  it('truncates with ellipsis when longer', () => {
    expect(truncate('una cadena bastante larga', 10)).toMatch(/…$/);
    expect(truncate('una cadena bastante larga', 10).length).toBe(10);
  });
});
