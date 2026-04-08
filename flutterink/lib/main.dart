import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'theme/inkboard_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'InkBoard',
      theme: AppTheme.theme,
      initialRoute: '/home',   // first screen on launch
      routes: {
        '/login':  (context) => const LoginScreen(),
        '/signup': (context) => const SignupScreen(),
        '/home':   (context) => const HomeScreen(),
      },
    );
  }
}
