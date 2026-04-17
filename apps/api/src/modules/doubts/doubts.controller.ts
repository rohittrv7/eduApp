import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DoubtsService } from './doubts.service';
import { CreateDoubtDto } from './dto/create-doubt.dto';

@Controller('doubts')
export class DoubtsController {
  constructor(private readonly doubtsService: DoubtsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateDoubtDto) {
    return this.doubtsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @Query('videoId') videoId?: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.doubtsService.findAll(videoId, chapterId);
  }

  @Post(':id/reply')
  reply(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { text: string },
  ) {
    return this.doubtsService.reply(id, user.id, body.text);
  }

  @Post(':id/upvote')
  upvote(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.doubtsService.upvote(id, user.id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.doubtsService.resolve(id, user.id, user.role);
  }
}
