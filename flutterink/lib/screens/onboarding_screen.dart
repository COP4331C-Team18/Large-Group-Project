import 'package:flutter/material.dart';
import '../services/prefs_service.dart';
import '../theme/app_colors.dart';
import '../widgets/dotted_background.dart';
import 'why_account_screen.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: DottedBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                _buildHeader(),
                const Spacer(),
                _buildIllustration(),
                const Spacer(),
                _buildGetStartedButton(context),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return const Column(
      children: [
        Text(
          'InkBoard',
          style: TextStyle(
            fontSize: 42,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            letterSpacing: -1,
          ),
        ),
        SizedBox(height: 12),
        Text(
          'A shared canvas for your ideas.\nSketch, annotate, and collaborate\nin real time.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: AppColors.textMuted,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  Widget _buildIllustration() {
    return SizedBox(
      height: 300,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Center board card
          _FloatingCard(
            width: 200,
            height: 140,
            offset: Offset.zero,
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.draw_outlined, size: 40, color: AppColors.accent),
                SizedBox(height: 8),
                Text(
                  'My Board',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),

          const _FloatingCard(
            width: 80,
            height: 80,
            offset: Offset(-110, -90),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.edit, color: AppColors.accent, size: 28),
                SizedBox(height: 4),
                Text('Pen', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),

          const _FloatingCard(
            width: 80,
            height: 80,
            offset: Offset(110, -90),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.category_outlined, color: AppColors.accent, size: 28),
                SizedBox(height: 4),
                Text('Shapes', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),

          const _FloatingCard(
            width: 90,
            height: 80,
            offset: Offset(-105, 90),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.group_outlined, color: AppColors.accent, size: 28),
                SizedBox(height: 4),
                Text('Collab', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),

          const _FloatingCard(
            width: 90,
            height: 80,
            offset: Offset(105, 90),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.ios_share_outlined, color: AppColors.accent, size: 28),
                SizedBox(height: 4),
                Text('Export', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGetStartedButton(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.accent,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () async {
            await PrefsService.markOnboardingSeen();
            if (!context.mounted) return;
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const WhyAccountScreen()),
            );
          },
          child: const Text(
            'Get Started',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

// ── Floating tool card ────────────────────────────────────────────────────────

class _FloatingCard extends StatelessWidget {
  final double width;
  final double height;
  final Offset offset;
  final Widget child;

  const _FloatingCard({
    required this.width,
    required this.height,
    required this.offset,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: offset,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border, width: 1),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 16,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
