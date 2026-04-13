import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../theme/app_colors.dart';
import '../models/board.dart';
import '../providers/board_provider.dart';
import '../widgets/tag_input_widget.dart';

Future<void> showBoardOptionsDialog(BuildContext context, Board board) {
  final boardProvider = context.read<BoardProvider>();
  return showGeneralDialog(
    context: context,
    barrierDismissible: true,
    barrierColor: Colors.black.withOpacity(0.5),
    barrierLabel: 'Dismiss',
    pageBuilder: (context, _, __) => _BoardOptionsDialog(
      board: board,
      boardProvider: boardProvider,
    ),
  );
}

class _BoardOptionsDialog extends StatefulWidget {
  final Board board;
  final BoardProvider boardProvider;

  _BoardOptionsDialog({
    required this.board,
    required this.boardProvider,
  });

  @override
  State<_BoardOptionsDialog> createState() => _BoardOptionsDialogState();
}

class _BoardOptionsDialogState extends State<_BoardOptionsDialog> {
  bool _isEditing = false;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Stack(
        children: [
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
            child: Container(color: Colors.transparent),
          ),
          Align(
            alignment: const Alignment(0, -0.4),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Dialog(
                backgroundColor: AppColors.background,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: const BorderSide(color: AppColors.border),
                ),
                insetPadding: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(28, 32, 28, 32),
                  child: _isEditing
                      ? _EditView(
                          board: widget.board,
                          boardProvider: widget.boardProvider,
                          onCancel: () => setState(() => _isEditing = false),
                          onSaved: () => Navigator.of(context).pop(),
                        )
                      : _OptionsView(
                          board: widget.board,
                          boardProvider: widget.boardProvider,
                          onEdit: () => setState(() => _isEditing = true),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionsView extends StatefulWidget {
  final Board board;
  final BoardProvider boardProvider;
  final VoidCallback onEdit;

  _OptionsView({
    required this.board, 
    required this.boardProvider,
    required this.onEdit
  });

  @override
  State<_OptionsView> createState() => _OptionsViewState();
}

class _OptionsViewState extends State<_OptionsView> {
  bool _isDeleting = false;

  Future<void> _delete() async {
    setState(() => _isDeleting = true);
    try {
      await widget.boardProvider.deleteBoard(widget.board.id);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      print('deleteBoard error: $e');
      setState(() => _isDeleting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete board.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                widget.board.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      letterSpacing: 1.5,
                      color: AppColors.accent,
                      fontFamily: 'Raleway',
                    ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Icon(Icons.close, color: AppColors.textMuted, size: 20),
            ),
          ],
        ),
        if (widget.board.description.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            widget.board.description,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppColors.textMuted),
          ),
        ],
        const SizedBox(height: 24),
        // Open board
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pushNamed('/board/${widget.board.id}');
            },
            child: const Text('OPEN BOARD',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2.0)),
          ),
        ),
        const SizedBox(height: 10),
        // Edit board
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: widget.onEdit,
            child: const Text('EDIT',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2.0)),
          ),
        ),
        const SizedBox(height: 10),
        // Delete board
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isDeleting ? null : _delete,
            style: OutlinedButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
              side: BorderSide(color: Theme.of(context).colorScheme.error),
            ),
            child: _isDeleting
                ? SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Theme.of(context).colorScheme.error,
                    ),
                  )
                : const Text('DELETE',
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2.0)),
          ),
        ),
      ],
    );
  }
}

// ── Edit view ─────────────────────────────────────────────────────────────────

class _EditView extends StatefulWidget {
  final Board board;
  final BoardProvider boardProvider;
  final VoidCallback onCancel;
  final VoidCallback onSaved;

  _EditView({
    required this.board,
    required this.boardProvider,
    required this.onCancel,
    required this.onSaved,
  });

  @override
  State<_EditView> createState() => _EditViewState();
}

class _EditViewState extends State<_EditView> {
  final _formKey = GlobalKey<FormState>();
  final _tagInputKey = GlobalKey<TagInputWidgetState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late List<String> _tags;
  bool _isSaving = false;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.board.title);
    _descriptionController =
        TextEditingController(text: widget.board.description);
    _tags = List<String>.from(widget.board.tags);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    _tagInputKey.currentState?.submitPending();
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isSaving = true;
      _saveError = null;
    });

    try {
      await widget.boardProvider.updateBoard(
            widget.board.id,
            title: _nameController.text.trim(),
            description: _descriptionController.text.trim(),
            tags: _tags,
          );
      if (mounted) widget.onSaved();
    } on DioException catch (e) {
      setState(() {
        _saveError = e.response?.data?['error'] as String? ??
            'Failed to save changes. Please try again.';
        _isSaving = false;
      });
    } catch (e) {
      print('updateBoard error: $e');
      setState(() {
        _saveError = 'Something went wrong. Please try again.';
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Edit Board',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      letterSpacing: 1.5,
                      color: AppColors.accent,
                      fontFamily: 'Raleway',
                    ),
              ),
              GestureDetector(
                onTap: _isSaving ? null : widget.onCancel,
                child:
                    Icon(Icons.close, color: AppColors.textMuted, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 20),
          TextFormField(
            controller: _nameController,
            enabled: !_isSaving,
            decoration: const InputDecoration(labelText: 'Board name *'),
            textCapitalization: TextCapitalization.sentences,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Board name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _descriptionController,
            enabled: !_isSaving,
            decoration: const InputDecoration(
              labelText: 'Description (optional)',
              alignLabelWithHint: true,
            ),
            maxLines: 3,
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 14),
          TagInputWidget(
            key: _tagInputKey,
            initialTags: _tags,
            onTagsChanged: (tags) => _tags = tags,
          ),
          if (_saveError != null) ...[
            const SizedBox(height: 12),
            Text(
              _saveError!,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isSaving ? null : widget.onCancel,
                  child: const Text('CANCEL',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2.0)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _isSaving ? null : _save,
                  child: _isSaving
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('SAVE',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 2.0)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}