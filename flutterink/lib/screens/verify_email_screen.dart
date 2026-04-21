import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/user_service.dart';
import '../models/user.dart';
import '../services/prefs_service.dart';
import '../theme/app_colors.dart';
import '../widgets/dotted_background.dart';
import 'home_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  /// The email that was just registered — pre-filled and shown to the user.
  final String email;

  const VerifyEmailScreen({super.key, required this.email});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  static const _codeLength = 6;

  final _userService = UserService();

  /// One controller + focus node per digit box.
  final List<TextEditingController> _controllers =
      List.generate(_codeLength, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(_codeLength, (_) => FocusNode());

  bool _isVerifying = false;
  bool _isResending = false;
  String? _errorMessage;

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  String get _code => _controllers.map((c) => c.text).join();

  bool get _codeComplete => _code.length == _codeLength;

  void _onDigitChanged(int index, String value) {
    if (value.length == 1) {
      // Advance to next box
      if (index < _codeLength - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        // Auto-submit when the last digit is entered
        if (_codeComplete) _verify();
      }
    }
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      // Jump back to the previous box on backspace when current is empty
      _focusNodes[index - 1].requestFocus();
    }
  }

  void _clearCode() {
    for (final c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  // ── API calls ────────────────────────────────────────────────────────────────

  Future<void> _verify() async {
    if (!_codeComplete || _isVerifying) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final User user = await _userService.verifyEmail(widget.email, _code);
      await PrefsService.markLoggedIn();

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
        (_) => false,
      );
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
      _clearCode();
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resend() async {
    if (_isResending) return;

    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    try {
      await _userService.resendVerification(widget.email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A new code has been sent to your email')),
      );
      _clearCode();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: true,
        leading: const BackButton(color: AppColors.accent),
      ),
      body: DottedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                _buildHeader(),
                const SizedBox(height: 40),
                _buildCodeBoxes(),
                const SizedBox(height: 20),
                if (_errorMessage != null) _buildError(),
                const SizedBox(height: 24),
                _buildVerifyButton(),
                const SizedBox(height: 24),
                _buildResendRow(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Check your\nemail',
          style: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            height: 1.2,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 12),
        RichText(
          text: TextSpan(
            style: const TextStyle(fontSize: 15, color: AppColors.textMuted),
            children: [
              const TextSpan(text: 'We sent a 6-digit code to\n'),
              TextSpan(
                text: widget.email,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCodeBoxes() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(_codeLength, (i) => _DigitBox(
        controller: _controllers[i],
        focusNode: _focusNodes[i],
        onChanged: (v) => _onDigitChanged(i, v),
        onKeyEvent: (e) => _onKeyEvent(i, e),
        hasError: _errorMessage != null,
      )),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        _errorMessage!,
        style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13),
      ),
    );
  }

  Widget _buildVerifyButton() {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.accent,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: (_codeComplete && !_isVerifying) ? _verify : null,
        child: _isVerifying
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : const Text(
                'Verify Email',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }

  Widget _buildResendRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text("Didn't get it? ", style: TextStyle(color: AppColors.textMuted)),
        _isResending
            ? const SizedBox(
                height: 14,
                width: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
              )
            : GestureDetector(
                onTap: _resend,
                child: const Text(
                  'Resend code',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.accent,
                  ),
                ),
              ),
      ],
    );
  }
}

// ── Digit Box ──────────────────────────────────────────────────────────────────

class _DigitBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final ValueChanged<KeyEvent> onKeyEvent;
  final bool hasError;

  const _DigitBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onKeyEvent,
    required this.hasError,
  });

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: FocusNode(),
      onKeyEvent: onKeyEvent,
      child: SizedBox(
        width: 48,
        height: 58,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(1),
          ],
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.surface,
            counterText: '',
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError ? Colors.red : AppColors.border,
                width: hasError ? 1.5 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError ? Colors.red : AppColors.accent,
                width: 2,
              ),
            ),
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
