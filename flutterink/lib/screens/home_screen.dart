import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/board_service.dart';
import '../api/user_service.dart';
import '../models/board.dart';
import '../models/user.dart';
import '../theme/app_colors.dart';
import 'board_detail_screen.dart';
import 'enter_code_screen.dart';

class HomeScreen extends StatefulWidget {
  final User user;
  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _boardService = BoardService();
  final _userService = UserService();

  List<Board>? _boards;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBoards();
  }

  Future<void> _loadBoards() async {
    setState(() { _loading = true; _error = null; });
    try {
      final boards = await _boardService.getBoards();
      setState(() { _boards = boards; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  Future<void> _createBoard() async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Board'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(labelText: 'Title'),
              autofocus: true,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(labelText: 'Description (optional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (result != true || titleCtrl.text.trim().isEmpty) return;

    try {
      final board = await _boardService.createBoard(
        title: titleCtrl.text.trim(),
        description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
      );
      setState(() { _boards = [...?_boards, board]; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Board "${board.title}" created')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _joinByCode() async {
    final codeCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Join Board by Code'),
        content: TextField(
          controller: codeCtrl,
          decoration: const InputDecoration(labelText: 'Join Code'),
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Join'),
          ),
        ],
      ),
    );

    if (result != true || codeCtrl.text.trim().isEmpty) return;

    try {
      final board = await _boardService.joinBoardByCode(codeCtrl.text.trim());
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BoardDetailScreen(board: board, currentUserId: widget.user.id),
          ),
        ).then((_) => _loadBoards());
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _logout() async {
    try {
      await _userService.logout();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const EnterCodeScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text(
          'My Boards',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.group_outlined, color: AppColors.accent),
            tooltip: 'Join by code',
            onPressed: _joinByCode,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.accent),
            tooltip: 'Log out',
            onPressed: _logout,
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        onPressed: _createBoard,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.accent));
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 12),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
              onPressed: _loadBoards,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (_boards == null || _boards!.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.dashboard_outlined, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text('No boards yet', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            const SizedBox(height: 8),
            const Text('Tap + to create one', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _loadBoards,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _boards!.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, i) => _BoardCard(
          board: _boards![i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => BoardDetailScreen(
                board: _boards![i],
                currentUserId: widget.user.id,
              ),
            ),
          ).then((_) => _loadBoards()),
        ),
      ),
    );
  }
}

class _BoardCard extends StatelessWidget {
  final Board board;
  final VoidCallback onTap;
  const _BoardCard({required this.board, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.accent.withOpacity(0.12),
          child: Text(
            board.title.isNotEmpty ? board.title[0].toUpperCase() : '?',
            style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(board.title, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        subtitle: board.description.isNotEmpty
            ? Text(board.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.textMuted))
            : Text(board.category, style: const TextStyle(color: AppColors.textMuted)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
      ),
    );
  }
}
