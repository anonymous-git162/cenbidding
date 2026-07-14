import { Module } from '@nestjs/common';
import { EbiddingController } from './ebidding.controller';
import { EbiddingService } from './ebidding.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [EbiddingController],
  providers: [EbiddingService],
  exports: [EbiddingService],
})
export class EbiddingModule {}
