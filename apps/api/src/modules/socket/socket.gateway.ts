import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { PollResponse } from '../polls/entities/poll-response.entity';
import { RedisService } from '../../common/redis/redis.service';
import { User } from '../users/entities/user.entity';

const PROFANITY_LIST = ['badword1', 'badword2', 'spam', 'abuse'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lower.includes(word));
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, cb: (err: Error | null, allow?: boolean) => void) => {
      cb(null, true);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private viewerCountInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(PollResponse)
    private readonly pollResponseRepo: Repository<PollResponse>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {
    // Emit viewer counts every 10 seconds
    this.viewerCountInterval = setInterval(() => {
      this.broadcastViewerCounts();
    }, 10000);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.['token'] as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '') ||
        (client.handshake.headers?.cookie as string)
          ?.split(';')
          .find((c) => c.trim().startsWith('access_token='))
          ?.split('=')[1];

      if (!token) {
        // Allow unauthenticated viewers (read-only)
        (client as any).user = null;
        return;
      }
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;
    } catch {
      // Invalid token — allow as anonymous viewer
      (client as any).user = null;
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const rooms = Array.from(client.rooms);
    for (const room of rooms) {
      if (room.startsWith('live:')) {
        const classId = room.replace('live:', '');
        await this.decrementViewerCount(classId);
      }
    }
  }

  @SubscribeMessage('live:join')
  async handleLiveJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classId: string },
  ): Promise<void> {
    const room = `live:${data.classId}`;
    await client.join(room);

    // Count actual connected sockets in room as source of truth
    const roomSockets = await this.server.in(room).fetchSockets();
    const count = roomSockets.length;

    // Update Redis with actual count
    await this.redisService.set(`live:viewers:${data.classId}`, String(count));
    this.server.to(room).emit('viewer:count', { classId: data.classId, count });
  }

  @SubscribeMessage('live:leave')
  async handleLiveLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classId: string },
  ): Promise<void> {
    const room = `live:${data.classId}`;
    await client.leave(room);

    const roomSockets = await this.server.in(room).fetchSockets();
    const count = roomSockets.length;
    await this.redisService.set(`live:viewers:${data.classId}`, String(count));
    this.server.to(room).emit('viewer:count', { classId: data.classId, count });
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classId: string; content: string },
  ): Promise<void> {
    const user = (client as any).user;
    if (!user) return;

    if (containsProfanity(data.content)) {
      client.emit('chat:error', { message: 'Message contains inappropriate content' });
      return;
    }

    // Fetch actual full_name from DB — JWT may not have it for old tokens
    let fullName = user.full_name;
    if (!fullName || fullName.startsWith('google_') || fullName.startsWith('email_')) {
      const dbUser = await this.userRepo.findOne({ where: { id: user.sub }, select: ['full_name', 'role'] });
      fullName = dbUser?.full_name || null;
    }
    // Final fallback — show first part of email or 'Student'
    const displayName = fullName || 'Student';

    const message = this.chatMessageRepo.create({
      live_class_id: data.classId,
      sender_id: user.sub,
      content: data.content,
    });
    const saved = await this.chatMessageRepo.save(message);

    this.server.to(`live:${data.classId}`).emit('chat:message', {
      id: saved.id,
      classId: data.classId,
      userId: user.sub,
      fullName: displayName,
      role: user.role ?? 'student',
      content: data.content,
      isPinned: false,
      createdAt: saved.created_at?.toISOString() ?? new Date().toISOString(),
    });
  }

  @SubscribeMessage('poll:respond')
  async handlePollRespond(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pollId: string; optionId: string },
  ): Promise<void> {
    const user = (client as any).user;
    if (!user) return;

    const existing = await this.pollResponseRepo.findOne({
      where: { poll_id: data.pollId, student_id: user.sub },
    });

    if (existing) {
      existing.option_id = data.optionId;
      await this.pollResponseRepo.save(existing);
    } else {
      const response = this.pollResponseRepo.create({
        poll_id: data.pollId,
        student_id: user.sub,
        option_id: data.optionId,
      });
      await this.pollResponseRepo.save(response);
    }

    // Emit to admin namespace
    this.server.of('/admin').emit('poll:response:live', {
      pollId: data.pollId,
      studentId: user.sub,
      optionId: data.optionId,
    });
  }

  // Called from REST endpoints to emit poll events
  emitPollLaunched(classId: string, poll: object): void {
    this.server.to(`live:${classId}`).emit('poll:launched', poll);
  }

  emitPollResults(classId: string, results: object): void {
    this.server.to(`live:${classId}`).emit('poll:results', results);
  }

  // Notification helpers
  emitToUser(userId: string, event: string, data: object): void {
    this.server.of('/notifications').to(`user:${userId}`).emit(event, data);
  }

  emitToAdmin(event: string, data: object): void {
    this.server.of('/admin').emit(event, data);
  }

  private async incrementViewerCount(classId: string): Promise<void> {
    const key = `live:viewers:${classId}`;
    const current = await this.redisService.get(key);
    const count = current ? parseInt(current, 10) + 1 : 1;
    await this.redisService.set(key, String(count));
  }

  private async decrementViewerCount(classId: string): Promise<void> {
    const key = `live:viewers:${classId}`;
    const current = await this.redisService.get(key);
    if (current) {
      const count = Math.max(0, parseInt(current, 10) - 1);
      await this.redisService.set(key, String(count));
    }
  }

  private async getViewerCount(classId: string): Promise<number> {
    const raw = await this.redisService.get(`live:viewers:${classId}`);
    return raw ? parseInt(raw, 10) : 0;
  }

  private async broadcastViewerCounts(): Promise<void> {
    try {
      const rooms = (this.server.sockets as any).adapter?.rooms as Map<string, Set<string>> | undefined;
      if (!rooms) return;
      for (const [room] of rooms) {
        if (room.startsWith('live:')) {
          const classId = room.replace('live:', '');
          // Use actual socket count — not Redis
          const roomSockets = await this.server.in(room).fetchSockets();
          const count = roomSockets.length;
          await this.redisService.set(`live:viewers:${classId}`, String(count));
          this.server.to(room).emit('viewer:count', { classId, count });
        }
      }
    } catch {
      // ignore errors in background task
    }
  }
}
