import { Injectable, Logger } from '@nestjs/common';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Hoy los emails se muestran en la terminal de la API (modo desarrollo).
// Cuando se elija el servicio real (Resend, Brevo, etc.), solo cambia este archivo.
@Injectable()
export class MailService {
  private readonly logger = new Logger('Email');

  async send(message: MailMessage): Promise<void> {
    this.logger.log(
      [
        '',
        '──────────── EMAIL (modo desarrollo, no se envía) ────────────',
        `Para:    ${message.to}`,
        `Asunto:  ${message.subject}`,
        '',
        message.text,
        '──────────────────────────────────────────────────────────────',
      ].join('\n'),
    );
  }
}
