import 'dart:ui';
import 'package:flutter/material.dart';
import '../api/user_service.dart';
import '../theme/app_colors.dart';
import '../widgets/code_widget.dart';

class VerifyEmailDialog extends StatefulWidget {
  final String email;
  const VerifyEmailDialog({super.key, required this.email});

  @override
  State<VerifyEmailDialog> createState() => _VerifyEmailDialogState();
}

class _VerifyEmailDialogState extends State<VerifyEmailDialog> {
  final _userService = UserService();
  final _codeInputKey = GlobalKey<CodeInputState>();

  bool _isVerifying = false;
  bool _isResending = false;
  String? _errorMessage;
  String? _successMessage;
  String _currentCode = '';

  Future<void> _verify() async {
    if (_currentCode.length < 6) {
      setState(() => _errorMessage = 'Please enter all 6 digits');
      return;
    }

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      await _userService.verifyEmail(widget.email, _currentCode);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
      _codeInputKey.currentState?.clear();
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _isResending = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      await _userService.resendVerification(widget.email);
      if (!mounted) return;
      setState(() => _successMessage = 'Code resent successfully');
      _codeInputKey.currentState?.clear();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isResending = false);
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
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8, right: 8),
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ),
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
                        const SizedBox(height: 16),
                        _buildFeedback(),
                        const SizedBox(height: 12),
                        _buildResendRow(),
                        const SizedBox(height: 20),
                        _buildVerifyButton(),
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
      children: [
        Image.asset('assets/verify-icon.png', height: 120),
        const SizedBox(height: 20),
        Text(
          'EMAIL VERIFICATION',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            letterSpacing: 2.0,
            color: AppColors.accent,
            fontFamily: 'Raleway',
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Enter the code sent to:',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          widget.email,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.accent,
          ),
        ),
      ],
    );
  }

  Widget _buildCodeSection() {
    return CodeInput(
      key: _codeInputKey,
      onChanged: (code) => _currentCode = code,
      inputMode: CodeInputMode.numbersOnly,
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
    if (_successMessage != null) {
      return Text(
        _successMessage!,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.green.shade600,
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildResendRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Didn't receive the code?  ",
          style: Theme.of(context).textTheme.bodySmall,
        ),
        GestureDetector(
          onTap: _isResending ? null : _resend,
          child: _isResending
              ? SizedBox(
                  height: 12,
                  width: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: AppColors.accent,
                  ),
                )
              : Text(
                  'RESEND',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.accent,
                    letterSpacing: 1.2,
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildVerifyButton() {
    return FilledButton(
      style: FilledButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
      ),
      onPressed: _isVerifying ? null : _verify,
      child: _isVerifying
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Text(
              'VERIFY',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: 2.0,
              ),
            ),
    );
  }
}