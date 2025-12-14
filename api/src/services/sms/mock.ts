import { SmsProvider } from './index';

export class MockSmsProvider implements SmsProvider {
  async sendCode(phone: string, code: string): Promise<boolean> {
    console.log(`[MOCK SMS] Sending code ${code} to ${phone}`);
    return true;
  }
}

