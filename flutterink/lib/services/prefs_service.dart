import 'package:shared_preferences/shared_preferences.dart';

/// Manages the two persistent flags that control the launch routing logic.
///
/// Flags:
///   _keyOnboarding  — true once the user has passed the onboarding screen
///   _keyLoggedIn    — true once the user has successfully logged in
class PrefsService {
  static const _keyOnboarding = 'has_seen_onboarding';
  static const _keyLoggedIn   = 'has_logged_in';

  // ── Onboarding ─────────────────────────────────────────────────────────────

  static Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyOnboarding) ?? false;
  }

  static Future<void> markOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyOnboarding, true);
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  static Future<bool> hasLoggedInBefore() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyLoggedIn) ?? false;
  }

  static Future<void> markLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyLoggedIn, true);
  }
}
