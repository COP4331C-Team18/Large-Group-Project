import 'package:dio/dio.dart';
import './api.dart';
import '../models/board.dart';

class BoardService {
  final Api _api = Api.instance;

  // GET /api/boards
  Future<List<Board>> getBoards() async {
    try {
      final response = await _api.get('/boards');
      return (response.data as List)
          .map((json) => Board.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to fetch boards';
      throw Exception(message);
    }
  }

  // POST /api/boards
  Future<Board> createBoard({
    required String title,
    String? category,
    String? description,
  }) async {
    try {
      final response = await _api.post('/boards', data: {
        'title': title,
        if (category != null) 'category': category,
        if (description != null) 'description': description,
      });
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to create board';
      throw Exception(message);
    }
  }

  // GET /api/boards/:id
  Future<Board> getBoardById(String id) async {
    try {
      final response = await _api.get('/boards/$id');
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to fetch board';
      throw Exception(message);
    }
  }

  // GET /api/boards/join/:code
  Future<Board> joinBoardByCode(String code) async {
    try {
      final response = await _api.get('/boards/join/$code');
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to join board';
      throw Exception(message);
    }
  }

  // POST /api/boards/:id/joinCode
  Future<Board> setJoinCode(String id, String code) async {
    try {
      final response = await _api.post('/boards/$id/joinCode', data: {
        'joinCode': code,
      });
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to set join code';
      throw Exception(message);
    }
  }

  // PUT /api/boards/:id
  Future<Board> updateBoard(String id, Map<String, dynamic> boardData) async {
    try {
      final response = await _api.put('/boards/$id', data: boardData);
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update board';
      throw Exception(message);
    }
  }

  // DELETE /api/boards/:id
  Future<void> deleteBoard(String id) async {
    try {
      await _api.delete('/boards/$id');
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to delete board';
      throw Exception(message);
    }
  }
}
