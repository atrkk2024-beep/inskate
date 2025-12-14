class ApiConfig {
  // Для локальной разработки используйте localhost
  // Для production замените на ваш URL с Vercel
  
  // Development
  // static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android Emulator
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS Simulator
  
  // Production - замените YOUR_API_URL на реальный URL после деплоя
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );
  
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Endpoints
  static const String auth = '/auth';
  static const String sendCode = '$auth/send-code';
  static const String verifyCode = '$auth/verify-code';
  static const String refresh = '$auth/refresh';
  static const String logout = '$auth/logout';
  static const String me = '$auth/me';
  static const String updateProfile = '$auth/me';
  static const String deviceToken = '$auth/device-token';
  
  static const String categories = '/categories';
  static const String lessons = '/lessons';
  static const String comments = '/comments';
  
  static const String plans = '/plans';
  static const String subscriptions = '/subscriptions';
  
  static const String coaches = '/coaches';
  static const String bookings = '/bookings';
  
  static const String videoReviews = '/video-reviews';
  
  static const String support = '/support';
  static const String contact = '$support/contact';
  static const String trialLesson = '$support/trial-lesson';
}
