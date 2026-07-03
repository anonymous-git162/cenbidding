import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { Socket } from 'socket.io';

function mockSocket(overrides: Partial<Socket> = {}): jest.Mocked<Socket> {
  return {
    id: 'socket-1',
    handshake: { headers: {}, auth: {}, query: {} } as any,
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    ...overrides,
  } as any;
}

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jwtService = { verify: jest.fn() } as any;
    configService = { get: jest.fn().mockReturnValue('secret') } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    gateway.server = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;
  });

  describe('handleConnection', () => {
    it('accepts a valid token from auth handshake', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = mockSocket({
        handshake: {
          headers: {},
          auth: { token: 'valid-jwt' },
          query: {},
        } as any,
      });
      gateway.handleConnection(client);
      expect(jwtService.verify).toHaveBeenCalledWith(
        'valid-jwt',
        expect.any(Object),
      );
      expect(client.data.userId).toBe('user-1');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('accepts a token from query param', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-2' });
      const client = mockSocket({
        handshake: {
          headers: {},
          auth: {},
          query: { token: 'query-token' },
        } as any,
      });
      gateway.handleConnection(client);
      expect(client.data.userId).toBe('user-2');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('accepts a token from cookie', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-3' });
      const client = mockSocket({
        handshake: {
          headers: { cookie: 'accessToken=token-from-cookie' },
          auth: {},
          query: {},
        } as any,
      });
      gateway.handleConnection(client);
      expect(client.data.userId).toBe('user-3');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects when no token is provided', () => {
      const client = mockSocket();
      gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects when JWT verification fails', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      const client = mockSocket({
        handshake: { headers: {}, auth: { token: 'bad' }, query: {} } as any,
      });
      gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('removes socket from userSockets map', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = mockSocket({
        handshake: { headers: {}, auth: { token: 'ok' }, query: {} } as any,
      });
      gateway.handleConnection(client);

      jest.spyOn(client, 'disconnect');
      gateway.handleDisconnect(client);
      expect(gateway['userSockets'].has('user-1')).toBe(false);
    });

    it('handles disconnect for unknown user gracefully', () => {
      const client = mockSocket({ data: {} });
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleJoin / handleLeave', () => {
    it('joins a room', () => {
      const client = mockSocket();
      gateway.handleJoin(client, { room: 'procurement:1' });
      expect(client.join).toHaveBeenCalledWith('procurement:1');
    });

    it('leaves a room', () => {
      const client = mockSocket();
      gateway.handleLeave(client, { room: 'procurement:1' });
      expect(client.leave).toHaveBeenCalledWith('procurement:1');
    });
  });

  describe('sendToUser', () => {
    it('emits event to all sockets of a user', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = mockSocket({
        handshake: { headers: {}, auth: { token: 'ok' }, query: {} } as any,
      });
      gateway.handleConnection(client);

      const client2 = mockSocket({
        id: 'socket-2',
        handshake: { headers: {}, auth: { token: 'ok' }, query: {} } as any,
      });
      gateway.handleConnection(client2);

      gateway.sendToUser('user-1', 'test-event', { msg: 'hello' });
      expect(gateway.server.to).toHaveBeenCalledWith('socket-1');
      expect(gateway.server.to).toHaveBeenCalledWith('socket-2');
    });

    it('does nothing for unknown user', () => {
      gateway.sendToUser('unknown', 'e', {});
      expect(gateway.server.to).not.toHaveBeenCalled();
    });
  });

  describe('sendToAll', () => {
    it('emits to all connected clients', () => {
      gateway.sendToAll('global-event', { data: 1 });
      expect(gateway.server.emit).toHaveBeenCalledWith('global-event', {
        data: 1,
      });
    });
  });

  describe('sendNotification', () => {
    it('delegates to sendToUser with notification event', () => {
      jest.spyOn(gateway, 'sendToUser').mockImplementation(() => {});
      const notif = { id: 'n1', title: 'Test', message: 'Hello' };
      gateway.sendNotification('user-1', notif);
      expect(gateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification',
        notif,
      );
    });
  });

  describe('sendProcurementUpdate', () => {
    it('emits to the procurement room', () => {
      gateway.sendProcurementUpdate('p-1', {
        status: 'OPEN',
        title: 'RFQ',
        updatedBy: 'admin',
      });
      expect(gateway.server.to).toHaveBeenCalledWith('procurement:p-1');
      expect(gateway.server.emit).toHaveBeenCalledWith('procurement:update', {
        status: 'OPEN',
        title: 'RFQ',
        updatedBy: 'admin',
      });
    });
  });

  describe('sendBulkNotification', () => {
    it('sends notification to each user', () => {
      jest.spyOn(gateway, 'sendNotification').mockImplementation(() => {});
      const notif = { id: 'n2', title: 'Bulk', message: 'Hi all' };
      gateway.sendBulkNotification(['u1', 'u2', 'u3'], notif);
      expect(gateway.sendNotification).toHaveBeenCalledTimes(3);
      expect(gateway.sendNotification).toHaveBeenCalledWith('u1', notif);
      expect(gateway.sendNotification).toHaveBeenCalledWith('u2', notif);
      expect(gateway.sendNotification).toHaveBeenCalledWith('u3', notif);
    });
  });
});
