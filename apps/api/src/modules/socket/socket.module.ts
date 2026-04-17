import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { PollResponse } from '../polls/entities/poll-response.entity';
import { User } from '../users/entities/user.entity';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
    TypeOrmModule.forFeature([ChatMessage, PollResponse, User]),
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
