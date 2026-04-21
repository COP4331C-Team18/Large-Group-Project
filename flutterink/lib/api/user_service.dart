import 'package:dio/dio.dart';
import './api.dart';
import '../models/user.dart';

class UserService {
  final Api _api = Api.instance;

  // POST /api/auth/login
  // Body: { login, password }
  // Returns the logged-in User on success, throws on failure
  Future<User> login(String login, String password) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'login': login,
        'password': password,
      });
      return User.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Login failed';
      throw Exception(message);
    }
  }
  // POST /api/auth/signup
  // Body: { username, email, password }
  // Returns the registered email on success, throws on failure
  Future<String> register(String username, String email, String password) async {
    try {
      final response = await _api.post('/auth/signup', data: {
        'username': username,
        'email': email,
        'password': password,
      });
      return response.data['email'] as String;
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Registration failed';
      throw Exception(message);
    }
  }

  // GET /api/auth/me
  // Returns the current logged-in User, or null if not authenticated
  Future<User?> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/me');
      if (response.data['authenticated'] == true) {
        return User.fromJson(response.data['user'] as Map<String, dynamic>);
      }
      return null;
    } on DioException catch (_) {
      return null;
    }
  }

  // POST /api/auth/verify-email
  // Body: { email, verificationCode }
  Future<User> verifyEmail(String email, String verificationCode) async {
    try {
      final response = await _api.post('/auth/verify-email', data: {
        'email': email,
        'verificationCode': verificationCode,
      });
      return User.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Email verification failed';
      throw Exception(message);
    }
  }

  // POST /api/auth/resend-verification
  // Body: { email }
  Future<void> resendVerification(String email) async {
    try {
      await _api.post('/auth/resend-verification', data: {'email': email});
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to resend verification';
      throw Exception(message);
    }
  }

  // POST /api/auth/google
  // Body: { idToken }
  Future<User> googleAuth(String idToken) async {
    try {
      final response = await _api.post('/auth/google', data: {'idToken': idToken});
      return User.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Google sign-in failed';
      throw Exception(message);
    }
  }

  // POST /api/auth/logout
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Logout failed';
      throw Exception(message);
    }
  }
}
