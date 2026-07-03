import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockContext = () =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ logIn: jest.fn(), cookies: {} }),
        getResponse: () => ({ cookie: jest.fn(), redirect: jest.fn() }),
      }),
    }) as any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access for public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should reject unauthenticated requests for non-public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    expect(guard.canActivate(mockContext())).rejects.toThrow();
  });
});
