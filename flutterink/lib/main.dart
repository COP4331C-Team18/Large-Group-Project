import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api/api.dart';
import 'services/prefs_service.dart';
import 'theme/app_colors.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding_screen.dart';
import 'screens/why_account_screen.dart';
import 'screens/enter_code_screen.dart';
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Api.initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  Future<Widget> _resolveHome() async {
    // TEMP: reset flags for testing — remove before shipping
    await SharedPreferences.getInstance().then((p) => p.clear());

    final results = await Future.wait([
      PrefsService.hasLoggedInBefore(),
      PrefsService.hasSeenOnboarding(),
    ]);

    final hasLoggedIn       = results[0];
    final hasSeenOnboarding = results[1];

    if (hasLoggedIn)       return const EnterCodeScreen();
    if (hasSeenOnboarding) return const WhyAccountScreen();
    return const OnboardingScreen();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'InkBoard',
      theme: AppTheme.light,
      home: FutureBuilder<Widget>(
        future: _resolveHome(),
        builder: (context, snapshot) {
          if (snapshot.hasData) return snapshot.data!;
          // Blank screen while prefs load (usually < 1 frame)
          return const Scaffold(backgroundColor: AppColors.background);
        },
      ),
    );
  }
}
