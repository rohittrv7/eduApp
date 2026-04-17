import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { AdminService } from '../admin/admin.service';

@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me/earnings')
  @Roles(UserRole.TEACHER)
  getMyEarnings(@CurrentUser() user: any) {
    return this.adminService.getTeacherEarnings(user.id);
  }
}
