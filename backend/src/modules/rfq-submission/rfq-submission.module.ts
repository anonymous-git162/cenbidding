import { Module } from '@nestjs/common';
import { RfqSubmissionController } from './rfq-submission.controller';
import { RfqSubmissionService } from './rfq-submission.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [RfqSubmissionController],
  providers: [RfqSubmissionService],
  exports: [RfqSubmissionService],
})
export class RfqSubmissionModule {}
