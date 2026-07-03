export const CURRENCIES = [
  { code: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { code: 'THB', label: 'THB - Thai Baht', symbol: '฿' },
  { code: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { code: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { code: 'MYR', label: 'MYR - Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', label: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
];

export const CURRENCY_MAP: Record<string, { symbol: string }> =
  Object.fromEntries(CURRENCIES.map(c => [c.code, { symbol: c.symbol }]));

export const CATEGORIES = [
  'IT Infrastructure', 'Software & Licensing', 'Office Supplies', 'Furniture & Equipment',
  'Facilities & Maintenance', 'Professional Services', 'Marketing & Advertising',
  'Travel & Transportation', 'Legal Services', 'Consulting', 'Training & Development',
  'Construction & Renovation', 'Security Services', 'Other',
];
