class AppConstants {
  // API URL - using standard 10.0.2.2 to refer to localhost backend in Android Emulators,
  // falling back to standard local host or custom env
  static const String baseApiUrl = 'https://eduapp-1-tqo2.onrender.com/api/v1';
  static const String fallbackApiUrl = 'http://localhost:3001/api/v1';

  // WebSocket Server Url
  static const String socketUrl = 'https://eduapp-1-tqo2.onrender.com';

  // Storage Keys
  static const String keyAccessToken = 'accessToken';
  static const String keyRefreshToken = 'refreshToken';
  static const String keyUserData = 'userData';
}
