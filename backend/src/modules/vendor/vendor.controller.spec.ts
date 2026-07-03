import { Test, TestingModule } from '@nestjs/testing';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('VendorController', () => {
  let controller: VendorController;
  let service: jest.Mocked<VendorService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      selfRegister: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [{ provide: VendorService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorController>(VendorController);
  });

  it('should create', async () => {
    const dto = {
      companyName: 'Acme',
      taxId: '12345',
      contactName: 'John',
      contactEmail: 'john@acme.com',
    };
    const expected = { id: 'v-1', ...dto };
    service.create.mockResolvedValue(expected as any);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('should findAll', async () => {
    const expected = [{ id: 'v-1', companyName: 'Acme' }];
    service.findAll.mockResolvedValue(expected as any);

    const result = await controller.findAll(1, 20, 'Acme');
    expect(service.findAll).toHaveBeenCalledWith(1, 20, 'Acme', undefined);
    expect(result).toBe(expected);
  });

  it('should findOne', async () => {
    const expected = { id: 'v-1' };
    service.findById.mockResolvedValue(expected as any);

    const result = await controller.findOne('v-1');
    expect(service.findById).toHaveBeenCalledWith('v-1');
    expect(result).toBe(expected);
  });

  it('should update', async () => {
    const dto = { companyName: 'Updated Acme' };
    const expected = { id: 'v-1', companyName: 'Updated Acme' };
    service.update.mockResolvedValue(expected as any);

    const result = await controller.update('v-1', dto);
    expect(service.update).toHaveBeenCalledWith('v-1', dto);
    expect(result).toBe(expected);
  });

  it('should remove', async () => {
    const expected = { id: 'v-1', status: 'INACTIVE' };
    service.remove.mockResolvedValue(expected as any);

    const result = await controller.remove('v-1');
    expect(service.remove).toHaveBeenCalledWith('v-1');
    expect(result).toBe(expected);
  });
});
