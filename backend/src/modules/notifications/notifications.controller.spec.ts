import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    service = {
      findByUser: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should findAll with unread filter', async () => {
    const expected = [{ id: 'n-1' }];
    service.findByUser.mockResolvedValue(expected as any);
    const result = await controller.findAll(mockReq, 'true');
    expect(service.findByUser).toHaveBeenCalledWith('user-1', true);
    expect(result).toBe(expected);
  });

  it('should findAll without unread filter', async () => {
    service.findByUser.mockResolvedValue([]);
    await controller.findAll(mockReq, undefined);
    expect(service.findByUser).toHaveBeenCalledWith('user-1', false);
  });

  it('should getUnreadCount', async () => {
    service.getUnreadCount.mockResolvedValue({ count: 3 } as any);
    const result = await controller.getUnreadCount(mockReq);
    expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ count: 3 });
  });

  it('should markAsRead', async () => {
    service.markAsRead.mockResolvedValue({
      id: 'n-1',
      readAt: new Date(),
    } as any);
    await controller.markAsRead('n-1', mockReq);
    expect(service.markAsRead).toHaveBeenCalledWith('n-1', 'user-1');
  });

  it('should markAllAsRead', async () => {
    service.markAllAsRead.mockResolvedValue({ count: 5 });
    await controller.markAllAsRead(mockReq);
    expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
  });

  it('should delete', async () => {
    service.delete.mockResolvedValue({ id: 'n-1' } as any);
    await controller.delete('n-1', mockReq);
    expect(service.delete).toHaveBeenCalledWith('n-1', 'user-1');
  });
});
