import { config } from '../../config';
import { P1SmsProvider } from './p1sms';
import { TwilioProvider } from './twilio';
import { MockSmsProvider } from './mock';

export interface SmsProvider {
  sendCode(phone: string, code: string): Promise<boolean>;
}

function createSmsProvider(): SmsProvider {
  if (config.nodeEnv === 'development' || config.nodeEnv === 'test' || config.testMode) {
    return new MockSmsProvider();
  }

  switch (config.smsProvider) {
    case 'p1sms':
      return new P1SmsProvider();
    case 'twilio':
      return new TwilioProvider();
    default:
      return new MockSmsProvider();
  }
}

export const smsProvider = createSmsProvider();

