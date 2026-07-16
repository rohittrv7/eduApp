import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsEmail, IsInt, IsString, Length, Matches, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OtpService } from '../auth/otp.service';
import { NotesService } from '../notes/notes.service';

class UpdateEmailDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 6) otp: string;
}

class UpdateMobileDto {
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' }) mobile: string;
  @IsString() @Length(6, 6) otp: string;
}

class CreateNoteDto {
  @IsString() videoId: string;
  @IsString() content: string;
  @IsInt() @Min(0) timestampSecs: number;
}

class UpdateNoteDto {
  @IsString() content: string;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly notesService: NotesService,
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user: User): Promise<User> {
    await this.usersService.updateStreak(user.id);
    return this.usersService.findById(user.id) as Promise<User>;
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/email')
  async updateEmail(@CurrentUser() user: User, @Body() dto: UpdateEmailDto): Promise<{ message: string }> {
    await this.otpService.verifyEmailOtp(dto.email, dto.otp);
    await this.usersService.updateUser(user.id, { email: dto.email });
    return { message: 'Email updated successfully' };
  }

  @Patch('me/mobile')
  async updateMobile(@CurrentUser() user: User, @Body() dto: UpdateMobileDto): Promise<{ message: string }> {
    await this.otpService.verifyOtp(dto.mobile, dto.otp);
    await this.usersService.updateUser(user.id, { mobile: dto.mobile });
    return { message: 'Mobile updated successfully' };
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('photo', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
        cb(new Error('Only JPEG and PNG files are allowed'), false);
      } else { cb(null, true); }
    },
  }))
  async uploadPhoto(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<{ profilePhoto: string }> {
    const url = await this.usersService.uploadProfilePhoto(user.id, file);
    return { profilePhoto: url };
  }

  @Get('me/stats')
  getStats(@CurrentUser() user: User) {
    return this.usersService.getStats(user.id);
  }

  @Get('me/progress/weekly')
  getWeeklyProgress(@CurrentUser() user: User) {
    return this.usersService.getWeeklyProgress(user.id);
  }

  @Get('me/progress/monthly')
  getMonthlyProgress(@CurrentUser() user: User) {
    return this.usersService.getMonthlyProgress(user.id);
  }

  // ── Personal Notes ────────────────────────────────────────────────────────

  @Get('me/notes/:videoId')
  getNotes(@CurrentUser() user: User, @Param('videoId') videoId: string) {
    return this.notesService.getNotesForVideo(user.id, videoId);
  }

  @Post('me/notes')
  @HttpCode(HttpStatus.CREATED)
  createNote(@CurrentUser() user: User, @Body() dto: CreateNoteDto) {
    return this.notesService.createNote(user.id, dto.videoId, dto.content, dto.timestampSecs);
  }

  @Patch('me/notes/:noteId')
  updateNote(
    @CurrentUser() user: User,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(user.id, noteId, dto.content);
  }

  @Delete('me/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@CurrentUser() user: User, @Param('noteId', ParseUUIDPipe) noteId: string) {
    return this.notesService.deleteNote(user.id, noteId);
  }
}
