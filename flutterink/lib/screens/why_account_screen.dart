import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/dotted_background.dart';
import 'auth_choice_screen.dart';
import 'enter_code_screen.dart';

class WhyAccountScreen extends StatelessWidget {
  const WhyAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: DottedBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Scrollable area: header + perks
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(28, 16, 28, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 32),
                      _buildPerks(),
                    ],
                  ),
                ),
              ),
              // Buttons always pinned to the bottom
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 0, 28, 48),
                child: _buildButtons(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Why be a member?',
          style: TextStyle(
            fontSize: 24,
            fontFamily: 'Inter',
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            height: 1.2,
            letterSpacing: -0.5,
          ),
        ),
        SizedBox(height: 12),
      ],
    );
  }

  Widget _buildPerks() {
    final perks = [
      (Icons.money_off_outlined,     'It\'s completely free',       'No credit card, no hidden fees. Ever.'),
      (Icons.cloud_done_outlined,    'Keep your designs forever',   'Your boards are saved to the cloud and always accessible.'),
      (Icons.login_outlined,         'Super simple with Google',    'Sign in with one tap using your Google account.'),
      (Icons.group_outlined,         'Collaborate in real time',    'Invite others to your board with a simple join code.'),
    ];

    return Column(
      children: perks
          .map((p) => _PerkTile(icon: p.$1, title: p.$2, subtitle: p.$3))
          .toList(),
    );
  }

  Widget _buildButtons(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.accent,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const AuthChoiceScreen()),
          ),
          child: const Text(
            'Register / Login',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),

        const SizedBox(height: 12),

        OutlinedButton(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.accent,
            side: const BorderSide(color: AppColors.accent),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const EnterCodeScreen()),
          ),
          child: const Text(
            'Continue without an account',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}

// ── Perk row ──────────────────────────────────────────────────────────────────

class _PerkTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _PerkTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.accent, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
