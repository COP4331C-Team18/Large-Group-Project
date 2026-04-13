import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/code_widget.dart';

Future<String?> showJoinBoardDialog(BuildContext context) {
  return showGeneralDialog<String>(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black.withOpacity(0.5),
    barrierLabel: 'Dismiss',
    pageBuilder: (context, _, __) => const JoinBoardDialog(),
  );
}

class JoinBoardDialog extends StatefulWidget {
  const JoinBoardDialog({super.key});

  @override
  State<JoinBoardDialog> createState() => _JoinBoardDialogState();
}

class _JoinBoardDialogState extends State<JoinBoardDialog> {
  final _codeInputKey = GlobalKey<CodeInputState>();

  bool _isJoining = false;
  String? _errorMessage;
  String _currentCode = '';

  Future<void> _join() async {
    if (_currentCode.length < 6) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }

    setState(() {
      _isJoining = true;
      _errorMessage = null;
    });

    try {
      // TODO: Join board by code API
      //   final board = await BoardService.instance.joinBoardByCode(_currentCode);
      //   if (!mounted) return;
      //   Navigator.of(context).pop(_currentCode);
      //
      // 
      if (!mounted) return;
      Navigator.of(context).pop(_currentCode);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
      _codeInputKey.currentState?.clear();
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

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
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 20),
                      _buildCodeSection(),
                      const SizedBox(height: 2),
                      _buildFeedback(),
                      const SizedBox(height: 12),
                      _buildJoinButton(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Join an InkBoard',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                letterSpacing: 1.5,
                color: AppColors.accent,
                fontFamily: 'Raleway',
              ),
            ),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Icon(
                Icons.close,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the host\'s code shared with you.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
              ),
        ),
      ],
    );
  }

  Widget _buildCodeSection() {
    return CodeInput(
      key: _codeInputKey,
      onChanged: (code) => _currentCode = code,
      inputMode: CodeInputMode.alphanumeric,
      onCompleted: (code) {
        _currentCode = code;
        setState(() {});
      },
    );
  }

  Widget _buildFeedback() {
    if (_errorMessage != null) {
      return Text(
        _errorMessage!,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.error,
            ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildJoinButton() {
    return FilledButton(
      style: FilledButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
      ),
      onPressed: _isJoining ? null : _join,
      child: _isJoining
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Text(
              'JOIN',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: 2.0,
              ),
            ),
    );
  }
}
