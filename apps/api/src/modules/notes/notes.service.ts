import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalNote } from './entities/personal-note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(PersonalNote)
    private readonly noteRepo: Repository<PersonalNote>,
  ) {}

  async getNotesForVideo(studentId: string, videoId: string): Promise<PersonalNote[]> {
    return this.noteRepo.find({
      where: { student_id: studentId, video_id: videoId },
      order: { timestamp_secs: 'ASC' },
    });
  }

  async createNote(studentId: string, videoId: string, content: string, timestampSecs: number): Promise<PersonalNote> {
    const note = this.noteRepo.create({
      student_id: studentId,
      video_id: videoId,
      content,
      timestamp_secs: timestampSecs,
    });
    return this.noteRepo.save(note);
  }

  async updateNote(studentId: string, noteId: string, content: string): Promise<PersonalNote> {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.student_id !== studentId) throw new ForbiddenException('Not your note');
    note.content = content;
    return this.noteRepo.save(note);
  }

  async deleteNote(studentId: string, noteId: string): Promise<void> {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.student_id !== studentId) throw new ForbiddenException('Not your note');
    await this.noteRepo.remove(note);
  }
}
