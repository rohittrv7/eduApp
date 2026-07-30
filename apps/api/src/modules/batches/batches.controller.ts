import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwt } from '../../common/decorators/optional-jwt.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(user.id, dto);
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @CurrentUser() user?: any,
  ) {
    // Teacher requesting their own batches
    if (role === 'teacher' && user?.id) {
      return this.batchesService.findByTeacher(user.id);
    }
    return this.batchesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('mine')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  findMine(@CurrentUser() user: any) {
    return this.batchesService.findByTeacher(user.id);
  }

  @Get('enrolled')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  findEnrolled(@CurrentUser() user: any) {
    return this.batchesService.findEnrolledByStudent(user.id);
  }

  @Get(':slug')
  @OptionalJwt()
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: any) {
    return this.batchesService.findBySlugWithEnrollment(slug, user?.id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.batchesService.remove(id, user.id, user.role);
  }

  @Get(':id/students')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  findBatchStudents(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findEnrolledStudents(id);
  }

  @Post(':id/enroll')
  @Roles(UserRole.STUDENT)
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.batchesService.enroll(user.id, id);
  }

  @Post(':id/feature')
  @Roles(UserRole.ADMIN)
  toggleFeatured(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.toggleFeatured(id);
  }
}
