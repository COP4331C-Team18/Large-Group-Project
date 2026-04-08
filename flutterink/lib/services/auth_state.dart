import 'package:flutter/foundation.dart';
import '../models/user.dart';

/// Holds the currently logged-in user across the app.
/// Provided at the root via ChangeNotifierProvider in main.dart.
class AuthState extends ChangeNotifier {
  User? _user;

  User? get user => _user;
  bool get isLoggedIn => _user != null;

  void setUser(User user) {
    _user = user;
    notifyListeners();
  }

  void clear() {
    _user = null;
    notifyListeners();
  }
}
