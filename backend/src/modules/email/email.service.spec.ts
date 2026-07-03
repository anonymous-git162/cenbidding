import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = { get: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('does not create a transporter when SMTP host is not set', () => {
    configService.get.mockReturnValue(undefined);
    const svc = new EmailService(configService);
    expect((svc as any).transporter).toBeNull();
  });

  it('send does nothing when transporter is null', async () => {
    await expect(service.send('a@b.com', 's', 'b')).resolves.toBeUndefined();
  });

  it('sendBulk does nothing when transporter is null', async () => {
    await expect(
      service.sendBulk([{ email: 'a@b.com', subject: 's', text: 'b' }]),
    ).resolves.toBeUndefined();
  });
});
