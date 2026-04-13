import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../theme/app_colors.dart';
import '../providers/board_provider.dart';
import '../widgets/tag_input_widget.dart';

Future<void> showCreateBoardDialog(
  BuildContext context,
  BoardProvider boardProvider,
) {
  return showGeneralDialog(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black.withOpacity(0.5),
    barrierLabel: 'Dismiss',
    pageBuilder: (context, _, __) =>
        _CreateBoardDialog(boardProvider: boardProvider),
  );
}

class _CreateBoardDialog extends StatefulWidget {
  final BoardProvider boardProvider;

  const _CreateBoardDialog({required this.boardProvider});

  @override
  State<_CreateBoardDialog> createState() => _CreateBoardDialogState();
}

class _CreateBoardDialogState extends State<_CreateBoardDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagInputKey = GlobalKey<TagInputWidgetState>();
  List<String> _tags = [];
  bool _isSubmitting = false;
  String? _submitError;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    _tagInputKey.currentState?.submitPending();
    if (!(_formKey.currentState?.validate() ?? false)){
      return;
    }
    setState(() {
      _isSubmitting = true;
      _submitError = null;
    });

    try {
      await widget.boardProvider.createBoard(
        title: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        tags: _tags,
      );
      if (mounted) Navigator.of(context).pop();
    } on DioException catch (e) {
      setState(() {
        _submitError = e.response?.data?['error'] as String? ??
            'Failed to create board. Please try again.';
        _isSubmitting = false;
      });
    } catch (_) {
      setState(() {
        _submitError = 'Something went wrong. Please try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    State<TagInputWidget> createState() => TagInputWidgetState();
    return Dialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.border),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'New Board',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      letterSpacing: 1.5,
                      color: AppColors.accent,
                      fontFamily: 'Raleway',
                    ),
                  ),
                  GestureDetector(
                    onTap: _isSubmitting? null: () => Navigator.of(context).pop(),
                    child: Icon(
                      Icons.close,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              TextFormField(
                controller: _nameController,
                enabled: !_isSubmitting,
                decoration: const InputDecoration(
                  labelText: 'Board name *',
                ),
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
                enabled: !_isSubmitting,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  alignLabelWithHint: true,
                ),
                maxLines: 3,
                textCapitalization: TextCapitalization.sentences,
              ),

              const SizedBox(height: 14),

              TagInputWidget(
                onTagsChanged: (tags) => _tags = tags,
              ),

              if (_submitError != null) ...[
                const SizedBox(height: 12),
                Text(
                  _submitError!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Create Board'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
