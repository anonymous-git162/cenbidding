import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async append(data: {
    procurementId: string;
    eventType: string;
    actorRole: string;
    actorId?: string;
    metadata?: any;
  }) {
    return this.prisma.procurementTimeline.create({ data });
  }

  async findByProcurement(procurementId: string) {
    const events = await this.prisma.procurementTimeline.findMany({
      where: { procurementId },
      orderBy: { timestamp: 'desc' },
    });

    const actorIds = [...new Set(events.filter(e => e.actorId).map(e => e.actorId!))];
    if (actorIds.length === 0) return events;

    const users = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, fullName: true },
    });
    const nameMap = new Map(users.map(u => [u.id, u.fullName]));

    return events.map(e => ({
      ...e,
      actorName: e.actorId ? nameMap.get(e.actorId) || null : null,
    }));
  }
}
