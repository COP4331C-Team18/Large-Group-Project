import 'package:flutter/material.dart';
import 'package:flutterink/screens/auth_choice_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api/api.dart';
import 'services/prefs_service.dart';
import 'services/auth_state.dart';
import 'theme/app_colors.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding_screen.dart';
import 'screens/why_account_screen.dart';
import 'screens/dashboard_screen.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Api.initialize();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()),
      ],
      child: const MyApp(),
    ),
  );
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

    if (hasLoggedIn)       return const DashboardScreen();
    if (hasSeenOnboarding) return const WhyAccountScreen();
    return const OnboardingScreen();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'InkBoard',
      theme: AppTheme.light,
      routes: {
        '/login':     (_) => const AuthChoiceScreen(),
        '/dashboard': (_) => const DashboardScreen(),
      },
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
