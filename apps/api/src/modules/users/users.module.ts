import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { WatchSession } from '../videos/entities/watch-session.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { PersonalNote } from '../notes/entities/personal-note.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TeachersController } from './teachers.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { NotesService } from '../notes/notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WatchSession, QuizAttempt, PersonalNote]),
    forwardRef(() => AuthModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [UsersController, TeachersController],
  providers: [UsersService, NotesService],
  exports: [UsersService],
})
export class UsersModule {}
