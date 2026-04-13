import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/board.dart';
import '../api/board_service.dart';

// Manages board list state for the dashboard -- FOR UI
class BoardProvider extends ChangeNotifier {
  List<Board> _boards = [];
  bool _isLoading = false;
  String? _error;

  List<Board> get boards => List.unmodifiable(_boards);
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Loads the user's boards from GET /api/boards.
  Future<void> fetchBoards() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _boards = await BoardService.instance.getMyBoards();
    } on DioException catch (e) {
      _error = e.response?.data?['error'] as String? ??
          'Failed to load boards. Please try again.';
    } catch (_) {
      _error = 'Something went wrong. Please try again.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // POST /api/boards and prepends the new board to the local list.
  Future<Board> createBoard({
    required String title,
    String description = '',
    String category = 'General',
    List<String> tags = const [],
  }) async {
    final board = await BoardService.instance.createBoard(
      title: title,
      description: description,
      category: category,
      tags: tags,
    );
    // Prepend so the newest board appears at the top of the list.
    _boards = [board, ..._boards];
    notifyListeners();
    return board;
  }

  Future<void> deleteBoard(String id) async {
  await BoardService.instance.deleteBoard(id);
  _boards = _boards.where((b) => b.id != id).toList();
  notifyListeners();
}

Future<Board> updateBoard(String id, {
  required String title,
  String description = '',
  String category = 'General',
  List<String> tags = const [],
}) async {
  final board = await BoardService.instance.updateBoard(id, {
    'title': title,
    'description': description,
    'tags': tags,
  });
  _boards = _boards.map((b) => b.id == id ? board : b).toList().cast<Board>();
  notifyListeners();
  return board;
}


  /// POST /api/auth/logout and clears local state.
  Future<void> logout() async {
    await BoardService.instance.logout();
    _boards = [];
    _error = null;
    notifyListeners();
  }
}
