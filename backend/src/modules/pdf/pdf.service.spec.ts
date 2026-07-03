import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();
    service = module.get<PdfService>(PdfService);
  });

  describe('generateTor', () => {
    it('returns a PDFDocument', () => {
      const doc = service.generateTor({
        requestNo: 'RFQ-001',
        title: 'Test',
        requestType: 'RFQ',
        status: 'DRAFT',
      });
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });
  });

  describe('generateResult', () => {
    it('returns a PDFDocument with winner info', () => {
      const doc = service.generateResult(
        { requestNo: 'RFQ-001', title: 'Test' },
        { winningVendor: { companyName: 'Acme' }, announcementText: 'Winner!' },
      );
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });

    it('handles empty result', () => {
      const doc = service.generateResult(
        { requestNo: 'RFQ-001', title: 'Test' },
        {},
      );
      expect(doc).toBeDefined();
    });
  });

  describe('generateContract', () => {
    it('returns a PDFDocument with vendor and contract data', () => {
      const doc = service.generateContract(
        { requestNo: 'RFQ-001', title: 'Test', createdAt: new Date() },
        { announcedAt: new Date(), announcementText: 'Terms text' },
        { companyName: 'Acme' },
      );
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });

    it('handles minimal data', () => {
      const doc = service.generateContract(
        { requestNo: 'RFQ-001', title: 'Test', createdAt: new Date() },
        {},
        { companyName: 'Acme' },
      );
      expect(doc).toBeDefined();
    });
  });

  describe('generateEvaluation', () => {
    it('returns a PDFDocument', () => {
      const evaluations = [
        {
          evaluator: { fullName: 'Alice' },
          vendor: { companyName: 'Acme' },
          score: 85,
          comment: 'Good',
        },
      ];
      const doc = service.generateEvaluation(
        { requestNo: 'RFQ-001', title: 'Test' },
        evaluations,
      );
      expect(doc).toBeDefined();
      expect(typeof doc.pipe).toBe('function');
    });

    it('handles empty evaluations', () => {
      const doc = service.generateEvaluation(
        { requestNo: 'RFQ-001', title: 'Test' },
        [],
      );
      expect(doc).toBeDefined();
    });
  });
});
