import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: MockPrisma;

  const mockConfigService = {
    get: (key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      return undefined;
    },
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    prisma = mockPrisma();
    strategy = new JwtStrategy(mockConfigService as ConfigService, prisma);
  });

  it('should return user for valid active user', async () => {
    const dbUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: 'ADMIN',
      isActive: true,
    };
    prisma.user.findUnique.mockResolvedValue(dbUser);

    const result = await strategy.validate({ sub: 'user-1' });
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@test.com',
      role: 'ADMIN',
    });
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'nonexistent' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when user is deactivated', async () => {
    const dbUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: 'ADMIN',
      isActive: false,
    };
    prisma.user.findUnique.mockResolvedValue(dbUser);

    await expect(strategy.validate({ sub: 'user-1' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
