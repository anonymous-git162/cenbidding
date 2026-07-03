import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('smtp.port') || 587,
        secure: this.configService.get<boolean>('smtp.secure') || false,
        auth: {
          user: this.configService.get<string>('smtp.user'),
          pass: this.configService.get<string>('smtp.pass'),
        },
      });
    }
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) return;
    await this.transporter.sendMail({
      from:
        this.configService.get<string>('smtp.from') || 'noreply@ebidding.com',
      to,
      subject,
      text,
    });
  }

  async sendBulk(
    recipients: { email: string; subject: string; text: string }[],
  ) {
    if (!this.transporter) return;
    for (const r of recipients) {
      await this.send(r.email, r.subject, r.text);
    }
  }
}
