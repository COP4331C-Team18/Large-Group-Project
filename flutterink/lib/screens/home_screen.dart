import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutterink/theme/inkboard_theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ── Ink-drip top decoration ──────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SvgPicture.asset(
              'assets/drip-1.svg',
              width: double.infinity,
              height: 175,
              fit: BoxFit.fitWidth,
            ),
          ),

          // ── Main content ─────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 16),

                  // ── Logo row ──────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.asset('assets/mushroom-icon.png', width: 65, height: 65),
                      const SizedBox(width: 5),
                      Text(
                        'InkBoard',
                        style: Theme.of(context).textTheme.displayLarge?.copyWith(letterSpacing: -0.5,)
                      ),
                    ],
                  ),

                  const SizedBox(height: 100),

                  // ── Tagline ──
                  Text(
                    'GET STARTED FOR FREE',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      letterSpacing: 1.5, 
                      color: AppColors.mossLight,
                      fontWeight: FontWeight.w700,
                      ),  
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Where ideas',
                    style: Theme.of(context).textTheme.displayLarge
                  ),
                  
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'flow like',
                        style: Theme.of(context).textTheme.displayLarge?.copyWith(
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w600,
                          color: AppColors.moss,
                        ),
                      ),
                      Text(
                        ' ink',
                        style: Theme.of(context).textTheme.displayLarge  
                      ),
                  ],
                ), 

                  const SizedBox(height: 10),

                  Image.asset('assets/home-icon.png', height: 300),

                  const Spacer(),

                  // ── LOG IN button ──
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/login'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.moss,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: 
                        Text(
                          'LOG IN',
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: AppColors.stemLight,
                            letterSpacing: 2.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── OR divider ──
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: AppColors.ink.withValues(alpha: 0.25),
                          thickness: 1,
                          endIndent: 10,
                        ),
                      ),
                      Text(
                        'OR',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      Expanded(
                        child: Divider(
                          color: AppColors.ink.withValues(alpha: 0.25),
                          thickness: 1,
                          indent: 10,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ── SIGN UP button ──
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pushNamed(context, '/signup'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.ink,
                        side: const BorderSide(
                          color: AppColors.capMid,
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: 
                        Text(
                          'SIGN UP',
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: AppColors.ink,
                            letterSpacing: 2.5,
                          ),
                        ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}



