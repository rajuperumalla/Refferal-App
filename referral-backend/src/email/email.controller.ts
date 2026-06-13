import { Body, Controller, Post } from '@nestjs/common';
import type { SendEmailDto } from './email.service';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async send(@Body() dto: SendEmailDto) {
    const ok = await this.emailService.send(dto);
    return { success: ok };
  }
}
