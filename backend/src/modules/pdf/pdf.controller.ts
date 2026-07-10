import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('PDF Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private prisma: PrismaService,
  ) {}

  @Get('tor/:procurementId')
  @ApiOperation({ summary: 'Export TOR as PDF' })
  async exportTor(@Param('procurementId') id: string, @Res() res: Response) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id },
    });
    if (!procurement) return res.status(404).json({ message: 'Not found' });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="tor-${procurement.requestNo}.pdf"`,
    });
    this.pdfService.generateTor(procurement).pipe(res);
  }

  @Get('result/:procurementId')
  @ApiOperation({ summary: 'Export result as PDF' })
  async exportResult(@Param('procurementId') id: string, @Res() res: Response) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id },
    });
    if (!procurement) return res.status(404).json({ message: 'Not found' });
    const result = await this.prisma.procurementResult.findUnique({
      where: { procurementId: id },
      include: { winningVendor: { select: { companyName: true } } },
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="result-${procurement.requestNo}.pdf"`,
    });
    this.pdfService.generateResult(procurement, result || {}).pipe(res);
  }

  @Get('contract/:procurementId')
  @ApiOperation({ summary: 'Export contract as PDF' })
  async exportContract(
    @Param('procurementId') id: string,
    @Res() res: Response,
  ) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id },
    });
    if (!procurement) return res.status(404).json({ message: 'Not found' });
    const result = await this.prisma.procurementResult.findUnique({
      where: { procurementId: id },
      include: { winningVendor: { select: { companyName: true } } },
    });
    if (!result?.winningVendor)
      return res
        .status(400)
        .json({ message: 'No award result or winning vendor' });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="contract-${procurement.requestNo}.pdf"`,
    });
    this.pdfService
      .generateContract(procurement, result, result.winningVendor)
      .pipe(res);
  }

  @Get('evaluation/:procurementId')
  @ApiOperation({ summary: 'Export evaluation as PDF' })
  async exportEvaluation(
    @Param('procurementId') id: string,
    @Res() res: Response,
  ) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id },
    });
    if (!procurement) return res.status(404).json({ message: 'Not found' });
    const evaluations = await this.prisma.evaluatorReview.findMany({
      where: { procurementId: id },
      include: {
        evaluator: { select: { fullName: true } },
        vendor: { select: { companyName: true } },
      },
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="evaluation-${procurement.requestNo}.pdf"`,
    });
    this.pdfService.generateEvaluation(procurement, evaluations).pipe(res);
  }
}
