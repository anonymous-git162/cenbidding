import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ResultsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getResult(
    procurementId: string,
    userId: string,
    userRole: string,
    vendorUserId?: string,
  ) {
    const result = await this.prisma.procurementResult.findUnique({
      where: { procurementId },
      include: {
        procurement: {
          select: { id: true, title: true, requestNo: true, status: true },
        },
        winningVendor: { select: { id: true, companyName: true } },
      },
    });

    if (!result) throw new NotFoundException('Result not found');

    if (userRole === 'VENDOR') {
      if (!vendorUserId)
        throw new BadRequestException('Vendor user ID required');

      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: vendorUserId },
      });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const isWinner = result.winningVendorId === vendor.id;
      return {
        ...result,
        status: isWinner ? 'Selected' : 'Not Selected',
        winningVendor: undefined,
        announcementText: isWinner ? result.announcementText : undefined,
      };
    }

    return result;
  }

  async closeCase(procurementId: string, _userId: string) {
    const result = await this.prisma.procurementResult.findUnique({
      where: { procurementId },
    });
    if (!result) throw new NotFoundException('Result not found');

    const updated = await this.prisma.procurementResult.update({
      where: { procurementId },
      data: { closedAt: new Date() },
    });

    await this.auditService.log({
      module: 'results',
      entityType: 'Procurement',
      entityId: procurementId,
      action: 'CASE_CLOSED',
      actorId: _userId,
    });

    return updated;
  }
}
