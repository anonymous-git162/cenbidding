import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../database/prisma.service';

describe('PdfController', () => {
  let controller: PdfController;
  let pdfService: jest.Mocked<PdfService>;
  let prisma: any;

  beforeEach(async () => {
    pdfService = {
      generateTor: jest.fn(),
      generateResult: jest.fn(),
      generateEvaluation: jest.fn(),
      generateContract: jest.fn(),
    };
    prisma = {
      procurement: { findUnique: jest.fn() },
      procurementResult: { findUnique: jest.fn() },
      evaluatorReview: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        { provide: PdfService, useValue: pdfService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<PdfController>(PdfController);
  });

  it('exportTor returns 404 when procurement not found', async () => {
    prisma.procurement.findUnique.mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.exportTor('bad-id', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('exportResult returns 404 when procurement not found', async () => {
    prisma.procurement.findUnique.mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.exportResult('bad-id', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('exportContract returns 404 when procurement not found', async () => {
    prisma.procurement.findUnique.mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.exportContract('bad-id', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('exportContract returns 400 when no winning vendor', async () => {
    prisma.procurement.findUnique.mockResolvedValue({
      id: 'p1',
      requestNo: 'RFQ-001',
    });
    prisma.procurementResult.findUnique.mockResolvedValue({
      winningVendor: null,
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.exportContract('p1', res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('exportContract pipes PDF when found', async () => {
    prisma.procurement.findUnique.mockResolvedValue({
      id: 'p1',
      requestNo: 'RFQ-001',
      title: 'Test',
    });
    prisma.procurementResult.findUnique.mockResolvedValue({
      winningVendor: { companyName: 'Acme' },
    });
    const mockDoc = { pipe: jest.fn() };
    pdfService.generateContract.mockReturnValue(mockDoc as any);
    const res = { set: jest.fn() } as any;
    await controller.exportContract('p1', res);
    expect(pdfService.generateContract).toHaveBeenCalled();
    expect(mockDoc.pipe).toHaveBeenCalledWith(res);
  });

  it('exportEvaluation returns 404 when procurement not found', async () => {
    prisma.procurement.findUnique.mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.exportEvaluation('bad-id', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('exportTor pipes PDF when found', async () => {
    prisma.procurement.findUnique.mockResolvedValue({
      id: 'p1',
      requestNo: 'RFQ-001',
      title: 'Test',
      requestType: 'RFQ',
      status: 'DRAFT',
    });
    const mockDoc = { pipe: jest.fn() };
    pdfService.generateTor.mockReturnValue(mockDoc as any);
    const res = { set: jest.fn(), setHeader: jest.fn() } as any;
    await controller.exportTor('p1', res);
    expect(pdfService.generateTor).toHaveBeenCalled();
    expect(mockDoc.pipe).toHaveBeenCalledWith(res);
  });
});
