import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:alledu_mobile/config/constants.dart';

class ApiClient {
  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  bool _isRefreshing = false;
  final List<Completer<String?>> _failedQueue = [];

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseApiUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Inject interceptors
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Read access token from secure storage
          final token = await _storage.read(key: AppConstants.keyAccessToken);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final response = error.response;
          final requestOptions = error.requestOptions;

          // If unauthorized and we haven't retried yet
          if (response?.statusCode == 401 && requestOptions.extra['retry'] != true) {
            requestOptions.extra['retry'] = true;

            if (_isRefreshing) {
              // Wait for refresh token flow to complete
              final completer = Completer<String?>();
              _failedQueue.add(completer);
              
              try {
                final newToken = await completer.future;
                if (newToken != null) {
                  requestOptions.headers['Authorization'] = 'Bearer $newToken';
                  final retriedResponse = await dio.fetch(requestOptions);
                  return handler.resolve(retriedResponse);
                }
              } catch (e) {
                return handler.next(error);
              }
            }

            _isRefreshing = true;

            try {
              final refreshToken = await _storage.read(key: AppConstants.keyRefreshToken);
              if (refreshToken == null) {
                throw Exception('No refresh token found');
              }

              // Request new access token using a clean Dio instance to avoid interceptor recursion
              final refreshDio = Dio(BaseOptions(baseUrl: AppConstants.baseApiUrl));
              final refreshResponse = await refreshDio.post(
                '/auth/refresh',
                data: {'refreshToken': refreshToken},
              );

              final newAccessToken = refreshResponse.data['accessToken'] as String?;
              if (newAccessToken != null) {
                // Save new token
                await _storage.write(key: AppConstants.keyAccessToken, value: newAccessToken);
                
                // Process queue
                for (final comp in _failedQueue) {
                  comp.complete(newAccessToken);
                }
                _failedQueue.clear();

                // Retry original request
                requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final retriedResponse = await dio.fetch(requestOptions);
                return handler.resolve(retriedResponse);
              }
            } catch (refreshErr) {
              // Clear queue and storage
              for (final comp in _failedQueue) {
                comp.completeError(refreshErr);
              }
              _failedQueue.clear();
              
              await _storage.delete(key: AppConstants.keyAccessToken);
              await _storage.delete(key: AppConstants.keyRefreshToken);
              await _storage.delete(key: AppConstants.keyUserData);

              // We can let the auth provider handle redirection by listening to stream/errors
            } finally {
              _isRefreshing = false;
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  // HTTP wrapper methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return dio.delete(path, data: data, queryParameters: queryParameters);
  }
}
