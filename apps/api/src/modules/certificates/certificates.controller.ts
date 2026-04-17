import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':uid')
  @Public()
  verify(@Param('uid') uid: string) {
    return this.certificatesService.verify(uid);
  }
}
