class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'https://api.medireferral.com';
  static const int connectTimeout = 10000;
  static const int receiveTimeout = 10000;

  // Auth Endpoints
  static const String sendOtp = '/api/auth/send-otp';
  static const String verifyOtp = '/api/auth/verify-otp';
  static const String refreshToken = '/api/auth/refresh';
  static const String logout = '/api/auth/logout';

  // Agent Endpoints
  static const String dashboard = '/api/agent/dashboard';
  static const String profile = '/api/agent/profile';
  static const String updateProfile = '/api/agent/profile/update';
  static const String bankDetails = '/api/agent/bank-details';

  // Patient/Lead Endpoints
  static const String patients = '/api/agent/patients';
  static const String createLead = '/api/agent/leads';
  static const String patientDetails = '/api/agent/patients/{id}';
  static const String updatePatient = '/api/agent/patients/{id}';
  static const String patientTimeline = '/api/agent/patients/{id}/timeline';
  static const String patientDocuments = '/api/agent/patients/{id}/documents';

  // Commission Endpoints
  static const String commissionSummary = '/api/agent/commissions/summary';
  static const String commissionPending = '/api/agent/commissions/pending';
  static const String commissionPaid = '/api/agent/commissions/paid';
  static const String commissionHistory = '/api/agent/commissions/history';

  // Notification Endpoints
  static const String notificationsList = '/api/agent/notifications';
  static const String markRead = '/api/agent/notifications/{id}/read';
  static const String markAllRead = '/api/agent/notifications/read-all';
  static const String fcmToken = '/api/agent/fcm-token';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String biometricKey = 'biometric_enabled';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';
}
