import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'REQUESTER' };
  const mockReq = { user: mockUser, cookies: {} };
  const mockRes = (): any => ({
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
      changePassword: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should login', async () => {
    const dto = { email: 'test@test.com', password: 'Password123' };
    const serviceResult = {
      accessToken: 'token',
      refreshToken: 'refresh',
      user: mockUser,
    };
    authService.login.mockResolvedValue(serviceResult as any);

    const result = await controller.login(dto, mockRes());
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ user: mockUser });
  });

  it('should register', async () => {
    const dto = {
      email: 'new@test.com',
      password: 'Password123',
      fullName: 'New User',
    };
    const serviceResult = {
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { ...mockUser, email: 'new@test.com' },
    };
    authService.register.mockResolvedValue(serviceResult as any);

    const result = await controller.register(dto, mockRes());
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ user: { ...mockUser, email: 'new@test.com' } });
  });

  it('should refresh token', async () => {
    const expected = { accessToken: 'new-token', refreshToken: 'new-refresh' };
    authService.refreshToken.mockResolvedValue(expected);

    const result = await controller.refresh(
      { ...mockReq, cookies: { refreshToken: 'old-refresh-token' } },
      mockRes(),
    );
    expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(result).toEqual({ message: 'Tokens refreshed' });
  });

  it('should logout', async () => {
    const expected = { message: 'Logged out successfully' };
    authService.logout.mockResolvedValue(expected);

    const result = await controller.logout(mockReq, mockRes());
    expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual(expected);
  });

  it('should get current user', async () => {
    const expected = { user: mockUser };
    authService.getMe.mockResolvedValue(expected as any);

    const result = await controller.getMe(mockReq);
    expect(authService.getMe).toHaveBeenCalledWith(mockUser.id);
    expect(result).toBe(expected);
  });

  it('should change password', async () => {
    const expected = { message: 'Password changed' };
    authService.changePassword.mockResolvedValue(expected);
    const body = { currentPassword: 'old', newPassword: 'NewPass123' };

    const result = await controller.changePassword(mockReq, body, mockRes());
    expect(authService.changePassword).toHaveBeenCalledWith(
      mockUser.id,
      body.currentPassword,
      body.newPassword,
    );
    expect(result).toBe(expected);
  });
});
