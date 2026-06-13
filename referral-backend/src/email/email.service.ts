import { Injectable, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface SendEmailDto {
  to: string;
  subject: string;
  htmlBody: string;
}

@Injectable()
export class EmailService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get('SMTP_PORT', '587')),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  // Runs after ALL modules init (Firebase Admin is guaranteed ready)
  onApplicationBootstrap() {
    this.watchMailQueue();
  }

  async send(dto: SendEmailDto): Promise<boolean> {
    const from = this.config.get('SMTP_FROM', 'MediReferral <noreply@medireferral.com>');
    try {
      await this.transporter.sendMail({
        from,
        to: dto.to,
        subject: dto.subject,
        html: dto.htmlBody,
      });
      this.logger.log(`Email sent to ${dto.to}: ${dto.subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${dto.to}: ${err.message}`);
      return false;
    }
  }

  // Watch Firestore mail_queue and process pending emails
  private watchMailQueue() {
    const db = getFirestore();
    const queue = db.collection('mail_queue');

    queue
      .where('status', '==', 'pending')
      .onSnapshot(async (snapshot: FirebaseFirestore.QuerySnapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type !== 'added') continue;
          const doc = change.doc;
          const data = doc.data();

          await doc.ref.update({ status: 'processing' });

          const success = await this.send({
            to: data.to,
            subject: data.subject,
            htmlBody: data.htmlBody,
          });

          await doc.ref.update({
            status: success ? 'sent' : 'failed',
            processedAt: FieldValue.serverTimestamp(),
          });
        }
      }, (err: Error) => {
        this.logger.error(`mail_queue watch error: ${err.message}`);
      });

    this.logger.log('Watching Firestore mail_queue for pending emails');
  }
}
