import { config } from '../../config';
import { SmsProvider } from './index';

export class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor() {
    this.accountSid = config.twilio.accountSid;
    this.authToken = config.twilio.authToken;
    this.phoneNumber = config.twilio.phoneNumber;
  }

  async sendCode(phone: string, code: string): Promise<boolean> {
    const message = `Your InSkate verification code is: ${code}`;

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: this.phoneNumber,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        console.error('Twilio error:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Twilio error:', error);
      return false;
    }
  }
}

