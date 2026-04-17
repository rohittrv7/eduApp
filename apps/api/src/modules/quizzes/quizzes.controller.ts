import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(user.id, dto);
  }

  @Get('attempts/recent')
  @Roles(UserRole.STUDENT)
  getRecentAttempts(@CurrentUser() user: any) {
    return this.quizzesService.getRecentAttempts(user.id);
  }

  @Get(':id')
  getQuiz(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const studentId = user?.role === UserRole.STUDENT ? user.id : undefined;
    return this.quizzesService.getQuiz(id, studentId);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateQuizDto>,
  ) {
    return this.quizzesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.quizzesService.remove(id, user.id, user.role);
  }

  @Post(':id/attempt')
  @Roles(UserRole.STUDENT)
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(id, user.id, dto);
  }

  @Get(':id/attempts')
  @Roles(UserRole.STUDENT)
  getAttempts(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.quizzesService.getAttempts(id, user.id);
  }
}
