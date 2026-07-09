import { Module } from '@nestjs/common';
import { RfqSubmissionController } from './rfq-submission.controller';
import { RfqSubmissionService } from './rfq-submission.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RfqSubmissionController],
  providers: [RfqSubmissionService],
  exports: [RfqSubmissionService],
})
export class RfqSubmissionModule {}
