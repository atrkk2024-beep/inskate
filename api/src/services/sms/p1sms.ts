import { config } from '../../config';
import { SmsProvider } from './index';

export class P1SmsProvider implements SmsProvider {
  private apiKey: string;
  private sender: string;

  constructor() {
    this.apiKey = config.p1sms.apiKey;
    this.sender = config.p1sms.sender;
  }

  async sendCode(phone: string, code: string): Promise<boolean> {
    const message = `Ваш код подтверждения InSkate: ${code}`;

    try {
      const response = await fetch('https://api.p1sms.ru/v1/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          text: message,
          sender: this.sender,
        }),
      });

      if (!response.ok) {
        console.error('P1SMS error:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('P1SMS error:', error);
      return false;
    }
  }
}

