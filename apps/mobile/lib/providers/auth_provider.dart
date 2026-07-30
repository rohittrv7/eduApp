import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/config/constants.dart';
import 'package:alledu_mobile/models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  UserProfile? _user;
  bool _isLoading = false;
  String? _identifier; // Store email/mobile temporarily during login

  UserProfile? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _loadUserFromStorage();
  }

  // Load cache on bootstrap
  Future<void> _loadUserFromStorage() async {
    _isLoading = true;
    notifyListeners();

    try {
      final cachedUser = await _storage.read(key: AppConstants.keyUserData);
      if (cachedUser != null) {
        _user = UserProfile.fromJson(jsonDecode(cachedUser));
      }
    } catch (_) {
      // Ignore cache load error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login with Email & Password
  Future<bool> loginEmail(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final accessToken = response.data['accessToken'] as String?;
      final refreshToken = response.data['refreshToken'] as String?;

      if (accessToken != null) {
        await _storage.write(key: AppConstants.keyAccessToken, value: accessToken);
        if (refreshToken != null) {
          await _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken);
        }
        await fetchProfile();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register with Email & Password
  Future<bool> registerEmail(String email, String password, String fullName) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/register',
        data: {'email': email, 'password': password, 'full_name': fullName},
      );

      final accessToken = response.data['accessToken'] as String?;
      final refreshToken = response.data['refreshToken'] as String?;

      if (accessToken != null) {
        await _storage.write(key: AppConstants.keyAccessToken, value: accessToken);
        if (refreshToken != null) {
          await _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken);
        }
        await fetchProfile();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Forgot Password (request OTP)
  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post('/auth/forgot-password', data: {'email': email});
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Reset Password
  Future<bool> resetPassword(String email, String otp, String newPassword) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post(
        '/auth/reset-password',
        data: {'email': email, 'otp': otp, 'newPassword': newPassword},
      );
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Send OTP (Email Mode by default)
  Future<bool> sendOtp(String email) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post('/auth/email/request-otp', data: {'email': email});
      _identifier = email;
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Verify OTP
  Future<bool> verifyOtp(String otp) async {
    if (_identifier == null) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/email/verify-otp',
        data: {'email': _identifier, 'otp': otp},
      );

      final accessToken = response.data['accessToken'] as String?;
      final refreshToken = response.data['refreshToken'] as String?;

      if (accessToken != null) {
        await _storage.write(key: AppConstants.keyAccessToken, value: accessToken);
        if (refreshToken != null) {
          await _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken);
        }
        await fetchProfile();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Native Google Login for Mobile
  Future<bool> loginWithGoogleMobile(String idToken) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/google/mobile',
        data: {'idToken': idToken},
      );

      final accessToken = response.data['accessToken'] as String?;
      final refreshToken = response.data['refreshToken'] as String?;

      if (accessToken != null) {
        await _storage.write(key: AppConstants.keyAccessToken, value: accessToken);
        if (refreshToken != null) {
          await _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken);
        }
        await fetchProfile();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch /users/me
  Future<void> fetchProfile() async {
    try {
      final response = await _apiClient.get('/users/me');
      final profile = UserProfile.fromJson(response.data);
      
      _user = profile;
      await _storage.write(key: AppConstants.keyUserData, value: jsonEncode(profile.toJson()));
      notifyListeners();
    } catch (e) {
      logout();
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.post('/auth/logout');
    } catch (_) {
      // Ignore logout api error
    } finally {
      _user = null;
      _identifier = null;
      await _storage.delete(key: AppConstants.keyAccessToken);
      await _storage.delete(key: AppConstants.keyRefreshToken);
      await _storage.delete(key: AppConstants.keyUserData);
      _isLoading = false;
      notifyListeners();
    }
  }
}
