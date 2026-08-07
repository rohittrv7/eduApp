import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';

/** Strip sensitive keys from settings before returning to client */
const SENSITIVE_SETTINGS_KEYS = [
  'smsApiKey',
  'fcmServerKey',
  'razorpayKeyId',
  'razorpayWebhookSecret',
  'razorpayKeySecret',
  'imagekitPrivateKey',
  'cloudinaryApiSecret',
];
function sanitizeSettings(settings: Record<string, any>): Record<string, any> {
  const clean = { ...settings };
  for (const key of SENSITIVE_SETTINGS_KEYS) {
    if (key in clean) clean[key] = clean[key] ? '••••••••' : '';
  }
  return clean;
}

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('students')
  getStudents(
    @Query('search') search?: string,
    @Query('skillLevel') skillLevel?: string,
    @Query('lastActiveFrom') lastActiveFrom?: string,
    @Query('lastActiveTo') lastActiveTo?: string,
    @Query('enrollmentStatus') enrollmentStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getStudents({
      search,
      skillLevel,
      lastActiveFrom,
      lastActiveTo,
      enrollmentStatus,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('students/export')
  async exportStudentsCsv(@Query('search') search?: string, @Res() res?: Response) {
    const csv = await this.adminService.exportStudentsCsv({ search });
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
      res.send(csv);
    }
    return csv;
  }

  @Post('students/:id/ban')
  banUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason: string }) {
    return this.adminService.banUser(id, body.reason);
  }

  @Post('users/:id/role')
  changeUserRole(@Param('id', ParseUUIDPipe) id: string, @Body() body: { role: string }) {
    return this.adminService.changeUserRole(id, body.role);
  }

  @Post('students/:id/unban')
  unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanUser(id);
  }

  @Post('students/:id/warn')
  warnUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: { message: string }) {
    return this.adminService.warnUser(id, body.message);
  }

  @Post('sessions/:userId/invalidate')
  invalidateSessions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.invalidateSessions(userId);
  }

  @Post('content/:type/:id/hide')
  hideContent(@Param('type') type: string, @Param('id', ParseUUIDPipe) id: string) {
    const allowed = ['video', 'note', 'announcement', 'doubt', 'live'];
    if (!allowed.includes(type)) {
      throw new BadRequestException(`Invalid content type: ${type}`);
    }
    return this.adminService.hideContent(type, id);
  }

  @Delete('content/:type/:id')
  deleteContent(@Param('type') type: string, @Param('id', ParseUUIDPipe) id: string) {
    const allowed = ['video', 'note', 'announcement', 'doubt', 'live'];
    if (!allowed.includes(type)) {
      throw new BadRequestException(`Invalid content type: ${type}`);
    }
    return this.adminService.deleteContent(type, id);
  }

  @Get('teachers')
  getTeachers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getTeachers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('teachers/:id/earnings')
  getTeacherEarnings(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getTeacherEarnings(id);
  }

  @Post('teachers/:id/payout')
  createPayout(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreatePayoutDto) {
    return this.adminService.createPayout(id, Math.floor(body.amount));
  }

  @Post('enrollments')
  manualEnroll(@Body() body: { studentId: string; batchId: string }) {
    return this.adminService.manualEnroll(body.studentId, body.batchId);
  }

  @Get('live-classes')
  getLiveClasses(@Query('status') status?: string) {
    return this.adminService.getLiveClasses(status);
  }

  @Get('settings')
  async getSettings() {
    const settings = (await this.adminService.getSettings()) as Record<string, any>;
    return sanitizeSettings(settings);
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.adminService.updateSettings(dto as Record<string, any>);
  }

  @Post('maintenance')
  toggleMaintenance(@Body() body: { enabled: boolean }) {
    return this.adminService.updateSettings({ maintenanceMode: body.enabled });
  }

  @Get('content/flagged')
  getFlaggedContent(
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getFlaggedContent({
      type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
