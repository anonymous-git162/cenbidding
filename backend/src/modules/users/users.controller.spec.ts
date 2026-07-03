import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockReq = { user: { id: 'admin-1', role: 'ADMIN' } };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      resetPassword: jest.fn(),
      unlock: jest.fn(),
      getProperties: jest.fn(),
      getDepartments: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should findAll', async () => {
    const expected = [{ id: 'u-1', email: 'test@test.com' }];
    service.findAll.mockResolvedValue(expected as any);

    const result = await controller.findAll({ page: 1, limit: 10 }, mockReq);
    expect(service.findAll).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      mockReq.user.role,
    );
    expect(result).toBe(expected);
  });

  it('should getProperties', async () => {
    const expected = [{ id: 'prop-1', name: 'Bangkok' }];
    service.getProperties.mockResolvedValue(expected as any);

    const result = await controller.getProperties();
    expect(service.getProperties).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('should getDepartments', async () => {
    const expected = [{ id: 'dept-1', name: 'IT' }];
    service.getDepartments.mockResolvedValue(expected as any);

    const result = await controller.getDepartments('prop-1');
    expect(service.getDepartments).toHaveBeenCalledWith('prop-1');
    expect(result).toBe(expected);
  });

  it('should findOne', async () => {
    const expected = { id: 'u-1', email: 'test@test.com' };
    service.findById.mockResolvedValue(expected as any);

    const result = await controller.findOne('u-1');
    expect(service.findById).toHaveBeenCalledWith('u-1');
    expect(result).toBe(expected);
  });

  it('should create', async () => {
    const dto = {
      email: 'new@test.com',
      password: 'Password123',
      fullName: 'New',
      role: 'REQUESTER' as const,
    };
    const expected = { id: 'u-2', ...dto };
    service.create.mockResolvedValue(expected as any);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('should update', async () => {
    const dto = { fullName: 'Updated' };
    const expected = { id: 'u-1', fullName: 'Updated' };
    service.update.mockResolvedValue(expected as any);

    const result = await controller.update('u-1', dto);
    expect(service.update).toHaveBeenCalledWith('u-1', dto);
    expect(result).toBe(expected);
  });

  it('should remove', async () => {
    const expected = { id: 'u-1', isActive: false };
    service.remove.mockResolvedValue(expected as any);

    const result = await controller.remove('u-1');
    expect(service.remove).toHaveBeenCalledWith('u-1');
    expect(result).toBe(expected);
  });

  it('should resetPassword', async () => {
    const dto = { password: 'NewPass123' };
    service.resetPassword.mockResolvedValue({
      message: 'Password reset',
    } as any);

    await controller.resetPassword('u-1', dto);
    expect(service.resetPassword).toHaveBeenCalledWith('u-1', dto.password);
  });

  it('should unlock', async () => {
    service.unlock.mockResolvedValue({ message: 'User unlocked' } as any);

    await controller.unlock('u-1');
    expect(service.unlock).toHaveBeenCalledWith('u-1');
  });
});
