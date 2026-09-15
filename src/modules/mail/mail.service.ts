import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

export interface SendOtpOptions {
  to: string;
  name: string;
  otp: string;
  expiresInMinutes?: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;
  private otpTemplate!: handlebars.TemplateDelegate;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
    this.loadTemplates();
  }

  private initTransporter() {
    const host =
      this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(
      this.configService.get<string>('SMTP_PORT') || '587',
      10,
    );
    const secure =
      this.configService.get<boolean>('SMTP_SECURE') ?? port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    if (user && pass) {
      this.logger.log(
        `MailService initialized with SMTP host: ${host}:${port}`,
      );
    } else {
      this.logger.warn(
        'SMTP_USER or SMTP_PASS is empty in .env. Emails will log OTP to console as fallback.',
      );
    }
  }

  private loadTemplates() {
    try {
      const templatePath = path.join(__dirname, 'templates', 'otp.hbs');

      // Check fallback path for ts-node / runtime dist
      const resolvedPath = fs.existsSync(templatePath)
        ? templatePath
        : path.join(
            process.cwd(),
            'src',
            'modules',
            'mail',
            'templates',
            'otp.hbs',
          );

      if (fs.existsSync(resolvedPath)) {
        const source = fs.readFileSync(resolvedPath, 'utf8');
        this.otpTemplate = handlebars.compile(source);
      } else {
        this.logger.warn(
          `OTP template file not found at ${resolvedPath}. Inline fallback will be used.`,
        );
        this.otpTemplate = handlebars.compile(
          '<h2>Hello {{name}}, your verification code is: <b>{{otp}}</b></h2><p>Valid for {{expiresInMinutes}} minutes.</p>',
        );
      }
    } catch (error) {
      this.logger.error('Failed to load email templates', error);
    }
  }

  /**
   * Send OTP Verification Email
   */
  async sendOtpEmail(options: SendOtpOptions): Promise<boolean> {
    const { to, name, otp, expiresInMinutes = 5 } = options;
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      'Daymoon B2B Marketplace <no-reply@daymoon.com>';

    const html = this.otpTemplate({
      name,
      otp,
      expiresInMinutes,
    });

    const pass = this.configService.get<string>('SMTP_PASS');

    // If SMTP_PASS is not provided yet in .env, log to console for development testing
    if (!pass || pass.trim() === '') {
      this.logger.warn(
        `[DEV MODE - NO SMTP PASSWORD SET] OTP for ${to} (${name}): >>> ${otp} <<< (Expires in ${expiresInMinutes}m)`,
      );
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: `${otp} is your Daymoon verification code`,
        html,
        text: `Hello ${name}, your Daymoon verification code is: ${otp}. It expires in ${expiresInMinutes} minutes.`,
      });

      this.logger.log(
        `Verification OTP email sent to ${to}. MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
      // Fallback log in development so user is never blocked
      this.logger.warn(
        `[FALLBACK LOG] OTP for ${to} (${name}): >>> ${otp} <<<`,
      );
      return false;
    }
  }
}
