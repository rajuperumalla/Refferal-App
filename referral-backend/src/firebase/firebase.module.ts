import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Global()
@Module({})
export class FirebaseModule implements OnModuleInit {
  private readonly logger = new Logger(FirebaseModule.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) return;

    // 1. Prefer a key file (default: referral-backend/serviceAccountKey.json)
    const keyPath =
      this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH') ||
      join(process.cwd(), 'serviceAccountKey.json');

    if (existsSync(keyPath)) {
      const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
      initializeApp({ credential: cert(serviceAccount) });
      this.logger.log(`Firebase Admin initialized from key file: ${keyPath}`);
      return;
    }

    // 2. Fall back to inline JSON env var
    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (serviceAccountJson) {
      initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
      this.logger.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON');
      return;
    }

    // 3. Application Default Credentials
    initializeApp();
    this.logger.log('Firebase Admin initialized with default credentials');
  }
}
