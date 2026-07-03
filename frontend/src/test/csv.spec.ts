import { sanitizeCSVCell, downloadCSV } from '../utils/csv';

describe('sanitizeCSVCell', () => {
  it('should return normal values unchanged', () => {
    expect(sanitizeCSVCell('hello')).toBe('hello');
    expect(sanitizeCSVCell('123')).toBe('123');
    expect(sanitizeCSVCell('normal text')).toBe('normal text');
  });

  it('should prefix = with single quote', () => {
    expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('should prefix + with single quote', () => {
    expect(sanitizeCSVCell('+12345')).toBe("'+12345");
  });

  it('should prefix - with single quote', () => {
    expect(sanitizeCSVCell('-12345')).toBe("'-12345");
  });

  it('should prefix @ with single quote', () => {
    expect(sanitizeCSVCell('@DANGER')).toBe("'@DANGER");
  });
});

describe('downloadCSV', () => {
  it('should create a download link', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: clickSpy } as any);

    downloadCSV('a,b,c', 'test.csv');

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:url');
  });
});
