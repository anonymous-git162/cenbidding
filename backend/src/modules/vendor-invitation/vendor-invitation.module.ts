import { Module } from '@nestjs/common';
import { VendorInvitationController } from './vendor-invitation.controller';
import { VendorInvitationService } from './vendor-invitation.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [VendorInvitationController],
  providers: [VendorInvitationService],
  exports: [VendorInvitationService],
})
export class VendorInvitationModule {}
