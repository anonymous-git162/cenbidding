import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeExpiredRounds() {
    const now = new Date();
    const expiredRounds = await this.prisma.ebiddingRound.findMany({
      where: { status: 'OPEN', endsAt: { lte: now } },
    });
    for (const round of expiredRounds) {
      await this.prisma.ebiddingRound.update({
        where: { id: round.id },
        data: { status: 'CLOSED' },
      });
    }
  }
}
