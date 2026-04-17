import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TestSeriesService } from './test-series.service';
import { CreateTestSeriesDto } from './dto/create-test-series.dto';
import { CreateMockTestDto } from './dto/create-mock-test.dto';

@Controller()
export class TestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  @Post('test-series')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  createTestSeries(@CurrentUser() user: any, @Body() dto: CreateTestSeriesDto) {
    return this.testSeriesService.createTestSeries(user.id, dto);
  }

  @Get('test-series')
  findAll() {
    return this.testSeriesService.findAll();
  }

  @Post('test-series/:id/tests')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  createMockTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMockTestDto,
  ) {
    return this.testSeriesService.createMockTest(id, dto);
  }

  @Post('tests/:id/attempt')
  @Roles(UserRole.STUDENT)
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { answers: Record<string, string>; autoSubmitted?: boolean },
  ) {
    return this.testSeriesService.submitAttempt(id, user.id, body.answers, body.autoSubmitted);
  }

  @Get('tests/:id/result/:attemptId')
  @Roles(UserRole.STUDENT)
  getResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.testSeriesService.getAttemptResult(id, attemptId);
  }
}
