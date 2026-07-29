import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StudyMaterialsService } from './study-materials.service';
import { CreateStudyMaterialDto } from './dto/create-study-material.dto';

@Controller('study-materials')
export class StudyMaterialsController {
  constructor(private readonly studyMaterialsService: StudyMaterialsService) {}

  /** Upload a PDF/image file → returns { path, url } */
  @Post('upload')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.studyMaterialsService.uploadFile(file, user.id);
  }

  /** Create a study material record (after upload or with external URL) */
  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateStudyMaterialDto) {
    return this.studyMaterialsService.create(user.id, dto);
  }

  /** List materials for a batch (teacher or enrolled student) */
  @Get()
  findByBatch(
    @Query('batchId') batchId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyMaterialsService.findByBatch(batchId, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studyMaterialsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.studyMaterialsService.remove(id, user.id, user.role);
  }

  /** Get a signed/direct URL to view the file */
  @Get(':id/url')
  getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.studyMaterialsService.getSignedUrl(id, user.id, user.role);
  }

  /** Proxy the file through the API — avoids X-Frame-Options / CORS from CDN */
  @Get(':id/file')
  async proxyFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { url } = await this.studyMaterialsService.getSignedUrl(id, user.id, user.role);

    // data: URL (dev fallback) — decode and send directly
    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const meta = parts[0] ?? '';
      const base64 = parts[1] ?? '';
      const mimeType = meta.split(':')[1]?.split(';')[0] ?? 'application/octet-stream';
      const buffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.send(buffer);
    }

    // Fetch from CDN and pipe through
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ message: 'Failed to fetch file from storage' });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/pdf';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Frame-Options', ''); // clear CDN header
    return res.send(buffer);
  }
}
