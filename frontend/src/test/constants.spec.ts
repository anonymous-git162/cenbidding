import { CURRENCIES, CURRENCY_MAP, CATEGORIES } from '../utils/constants';

describe('CURRENCIES', () => {
  it('should have 11 currencies', () => {
    expect(CURRENCIES).toHaveLength(11);
  });

  it('should include THB', () => {
    expect(CURRENCIES.find(c => c.code === 'THB')).toBeDefined();
    expect(CURRENCIES.find(c => c.code === 'THB')?.symbol).toBe('฿');
  });
});

describe('CURRENCY_MAP', () => {
  it('should map USD to $ symbol', () => {
    expect(CURRENCY_MAP['USD'].symbol).toBe('$');
  });

  it('should map THB to ฿ symbol', () => {
    expect(CURRENCY_MAP['THB'].symbol).toBe('฿');
  });

  it('should have all codes from CURRENCIES', () => {
    for (const c of CURRENCIES) {
      expect(CURRENCY_MAP[c.code]).toBeDefined();
    }
  });
});

describe('CATEGORIES', () => {
  it('should have multiple categories', () => {
    expect(CATEGORIES.length).toBeGreaterThan(5);
    expect(CATEGORIES).toContain('Other');
    expect(CATEGORIES).toContain('IT Infrastructure');
  });
});
