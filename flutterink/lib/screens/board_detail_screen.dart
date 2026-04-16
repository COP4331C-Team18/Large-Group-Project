import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/board_service.dart';
import '../models/board.dart';
import '../theme/app_colors.dart';

class BoardDetailScreen extends StatefulWidget {
  final Board board;
  final String currentUserId;
  const BoardDetailScreen({super.key, required this.board, required this.currentUserId});

  @override
  State<BoardDetailScreen> createState() => _BoardDetailScreenState();
}

class _BoardDetailScreenState extends State<BoardDetailScreen> {
  final _boardService = BoardService();

  late Board _board;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _board = widget.board;
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      final fresh = await _boardService.getBoardById(_board.id);
      setState(() => _board = fresh);
    } catch (e) {
      _showError(e);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _editBoard() async {
    final titleCtrl = TextEditingController(text: _board.title);
    final descCtrl = TextEditingController(text: _board.description);
    final catCtrl = TextEditingController(text: _board.category);

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Board'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title'), autofocus: true),
            const SizedBox(height: 8),
            TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 8),
            TextField(controller: catCtrl, decoration: const InputDecoration(labelText: 'Category')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result != true) return;

    try {
      final updated = await _boardService.updateBoard(_board.id, {
        'title': titleCtrl.text.trim(),
        'description': descCtrl.text.trim(),
        'category': catCtrl.text.trim(),
      });
      setState(() => _board = updated);
      _showSnack('Board updated');
    } catch (e) {
      _showError(e);
    }
  }

  Future<void> _setJoinCode() async {
    final codeCtrl = TextEditingController(text: _board.joinCode ?? '');
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Set Join Code'),
        content: TextField(
          controller: codeCtrl,
          decoration: const InputDecoration(
            labelText: '6-character hex code',
            hintText: 'e.g. a1b2c3',
          ),
          autofocus: true,
          maxLength: 6,
          textCapitalization: TextCapitalization.none,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Set'),
          ),
        ],
      ),
    );

    if (result != true || codeCtrl.text.trim().isEmpty) return;

    try {
      final updated = await _boardService.setJoinCode(_board.id, codeCtrl.text.trim());
      setState(() => _board = updated);
      _showSnack('Join code set: ${updated.joinCode}');
    } catch (e) {
      _showError(e);
    }
  }

  Future<void> _deleteBoard() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Board'),
        content: Text('Delete "${_board.title}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await _boardService.deleteBoard(_board.id);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      _showError(e);
    }
  }

  void _showError(Object e) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red),
    );
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  bool get _isOwner => _board.ownerId == widget.currentUserId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text(_board.title,
            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        leading: const BackButton(color: AppColors.accent),
        actions: _isOwner
            ? [
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: AppColors.accent),
                  tooltip: 'Edit',
                  onPressed: _editBoard,
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  tooltip: 'Delete',
                  onPressed: _deleteBoard,
                ),
              ]
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : RefreshIndicator(
              color: AppColors.accent,
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _InfoCard(board: _board),
                  const SizedBox(height: 16),
                  if (_isOwner) ...[
                    _ActionTile(
                      icon: Icons.tag,
                      label: 'Set Join Code',
                      subtitle: _board.joinCode != null ? 'Current: ${_board.joinCode}' : 'Not set',
                      onTap: _setJoinCode,
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (_board.joinCode != null) ...[
                    _ActionTile(
                      icon: Icons.copy,
                      label: 'Copy Join Code',
                      subtitle: _board.joinCode!,
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: _board.joinCode!));
                        _showSnack('Copied: ${_board.joinCode}');
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                  _InfoRow(label: 'ID', value: _board.id),
                  _InfoRow(label: 'Owner ID', value: _board.ownerId),
                  if (_board.createdAt != null)
                    _InfoRow(label: 'Created', value: _board.createdAt!.toLocal().toString()),
                  if (_board.updatedAt != null)
                    _InfoRow(label: 'Updated', value: _board.updatedAt!.toLocal().toString()),
                  if (_board.revisions.isNotEmpty)
                    _InfoRow(label: 'Revisions', value: '${_board.revisions.length}'),
                ],
              ),
            ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final Board board;
  const _InfoCard({required this.board});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(board.title,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          if (board.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(board.description, style: const TextStyle(color: AppColors.textMuted)),
          ],
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(board.category,
                style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          if (board.tags.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: board.tags
                  .map((t) => Chip(
                        label: Text(t, style: const TextStyle(fontSize: 11)),
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.accent, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    if (subtitle != null)
                      Text(subtitle!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontFamily: 'monospace')),
          ),
        ],
      ),
    );
  }
}
