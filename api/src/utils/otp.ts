import { config } from '../config';

export function generateOtp(): string {
  // В тестовом режиме используем фиксированный код
  if (config.testMode) {
    return '000000';
  }
  
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < config.otp.length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export function getOtpExpiryDate(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + config.otp.expiryMinutes);
  return expiry;
}

