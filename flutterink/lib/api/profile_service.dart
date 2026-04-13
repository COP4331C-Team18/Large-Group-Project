import 'package:dio/dio.dart';
import './api.dart';
import '../models/user.dart';

class ProfileService {
  final Api _api = Api.instance;

  // GET /api/users
  Future<List<User>> getUsers() async {
    try {
      final response = await _api.get('/users');
      return (response.data as List)
          .map((json) => User.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to fetch users';
      throw Exception(message);
    }
  }

  // GET /api/users/:id
  Future<User> getUserById(String id) async {
    try {
      final response = await _api.get('/users/$id');
      return User.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to fetch user';
      throw Exception(message);
    }
  }

  // PUT /api/users/:id/username
  // Body: { username }
  Future<User> updateUsername(String id, String username) async {
    try {
      final response = await _api.put('/users/$id/username', data: {
        'username': username,
      });
      return User.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update username';
      throw Exception(message);
    }
  }

  // PUT /api/users/:id/password
  // Body: { currentPassword, newPassword }
  Future<void> updatePassword(String id, String currentPassword, String newPassword) async {
    try {
      await _api.put('/users/$id/password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update password';
      throw Exception(message);
    }
  }

  // DELETE /api/users/:id
  Future<void> deleteUser(String id) async {
    try {
      await _api.delete('/users/$id');
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to delete user';
      throw Exception(message);
    }
  }
}
