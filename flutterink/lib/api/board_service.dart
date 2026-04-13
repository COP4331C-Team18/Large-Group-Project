import 'package:dio/dio.dart';
import './api.dart';
import '../models/board.dart';

class BoardService {
  BoardService._();
  static final BoardService instance = BoardService._();

  // GET /api/boards
  Future<List<Board>> getMyBoards() async {
  try {
    final response = await Api.instance.get('/boards');
    print('getMyBoards response: ${response.data}'); // 👈
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
    String description = '',
    String category = 'General',
    List<String> tags = const [],
  }) async {
    try {
      final response = await Api.instance.post('/boards', data: {
        'title': title,
        if (description.isNotEmpty) 'description': description,
        'category': category,
        if (tags.isNotEmpty) 'tags': tags,
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
      final response = await Api.instance.get('/boards/$id');
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to fetch board';
      throw Exception(message);
    }
  }

  // GET /api/boards/join/:code
  Future<Board> joinBoardByCode(String code) async {
    try {
      final response = await Api.instance.get('/boards/join/$code');
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to join board';
      throw Exception(message);
    }
  }

  // POST /api/boards/:id/joinCode
  Future<Board> setJoinCode(String id, String code) async {
    try {
      final response = await Api.instance.post('/boards/$id/joinCode', data: {
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
      final response = await Api.instance.put('/boards/$id', data: boardData);
      return Board.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to update board';
      throw Exception(message);
    }
  }

  // DELETE /api/boards/:id
  Future<void> deleteBoard(String id) async {
    try {
      await Api.instance.delete('/boards/$id');
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to delete board';
      throw Exception(message);
    }
  }

  // POST /api/auth/logout
  Future<void> logout() async {
    try {
      await Api.instance.post('/auth/logout');
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Failed to logout';
      throw Exception(message);
    }
  }
}