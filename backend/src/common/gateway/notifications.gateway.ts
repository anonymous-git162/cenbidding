import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

const WS_ALLOWED = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:80',
  'http://localhost',
  'https://cenbidding.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

function extractCookie(client: Socket, name: string): string | undefined {
  const cookieHeader = client.handshake.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || WS_ALLOWED.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connecting: ${client.id}`);
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        extractCookie(client, 'accessToken');
      if (!token) {
        console.log(`[WebSocket] Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      const totalClients = Array.from(this.userSockets.values()).reduce((sum, set) => sum + set.size, 0);
      console.log(`[WebSocket] Client connected: ${client.id} (user: ${userId}), total: ${totalClients}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
  }

  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  sendNotification(
    userId: string,
    notification: { id: string; title: string; message: string; link?: string },
  ) {
    this.sendToUser(userId, 'notification', notification);
  }

  sendProcurementUpdate(
    procurementId: string,
    data: { status: string; title: string; updatedBy: string },
  ) {
    this.server
      .to(`procurement:${procurementId}`)
      .emit('procurement:update', data);
  }

  sendBulkNotification(
    userIds: string[],
    notification: { id: string; title: string; message: string; link?: string },
  ) {
    userIds.forEach((userId) => this.sendNotification(userId, notification));
  }

  sendBidUpdate(roundId: string, data: any) {
    console.log(`[WebSocket] sendBidUpdate called: roundId=${roundId}, server=${!!this.server}, clients=${this.server?.engine?.clientsCount || 0}`);
    // Broadcast to room if clients joined, fallback to all connected clients
    this.server.to(`bidding:${roundId}`).emit('bid:update', data);
    this.server.emit('bid:update', data);
  }
}
