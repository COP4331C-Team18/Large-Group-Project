import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutterink/theme/inkboard_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleCreateAccount() {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill in all fields'),
          backgroundColor: AppColors.soil,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    if (password.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Password must be at least 10 characters'),
          backgroundColor: AppColors.soil,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    if (password != _confirmPasswordController.text.trim()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Passwords do not match'),
          backgroundColor: AppColors.soil,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    /* !!! CONNECT TO BACKEND AUTH HERE !!! && IMPLEMENT DASHBOARD SCREEN
    final success = await AuthService.login(username, password);
    if (success) {
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Invalid username or password')),
      );
    } */
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Create account coming soon'),
        backgroundColor: AppColors.soil,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _handleGoogle() {
    // !!! IMPLEMENT GOOGLE OAUTH HERE !!!
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Google sign-in coming soon'),
        backgroundColor: AppColors.soil,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

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
              'assets/drip.svg',
              width: double.infinity,
              height: 190,
              fit: BoxFit.fitWidth,
            ),
          ),

          // ── Scrollable main content ───────────────────────────────
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 10),

                  // ── Logo row ────────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [ 
                      IconButton(
                        onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded),
                        color: AppColors.ink,
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.sageLight,
                          shape: const CircleBorder(),
                        ),
                      ),
                      const Spacer(),
                      Image.asset('assets/mushroom-icon.png', width: 65, height: 65),
                      const SizedBox(width: 5),
                      Text(
                        'InkBoard',
                        style: Theme.of(context).textTheme.displayLarge?.copyWith(letterSpacing: -0.5,)
                      ),
                      const Spacer(),
                      const SizedBox(width: 32),
                    ],
                  ),

                  const SizedBox(height: 65),

                  Image.asset("assets/signup-icon.png", height: 150),

                  const SizedBox(height: 10),

                  // ── Welcome heading ──────────────────────────────────
                  Text(
                    "LET'S GET STARTED",
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      fontFamily: 'Raleway',
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2.5,
                      color: AppColors.forest,
                    ),
                  ),
                  

                  const SizedBox(height: 24),

                  // ── Email field ──
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Email',
                      hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.capMid,
                      ),
                      filled: true,
                      fillColor: AppColors.sageLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Username field ──
                  TextField(
                    controller: _usernameController,
                    keyboardType: TextInputType.text,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Username',
                      hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.capMid,
                      ),
                      filled: true,
                      fillColor: AppColors.sageLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Password field ──
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Password',
                      hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.capMid,
                      ),
                      filled: true,
                      fillColor: AppColors.sageLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.stem,
                          size: 20,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Confirm Password field ──
                  TextField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Confirm Password',
                      hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.capMid,
                      ),
                      filled: true,
                      fillColor: AppColors.sageLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.stem,
                          size: 20,
                        ),
                        onPressed: () => setState(
                          () => _obscureConfirmPassword = !_obscureConfirmPassword,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Create Account button ───────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _handleCreateAccount,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.moss,
                        foregroundColor: AppColors.stemLight,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: Text(
                        'CREATE ACCOUNT',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ),
                  ),

                  const SizedBox(height: 15),

                  // ── OR divider ───────────────────────────────────────
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
                        'OR SIGN IN WITH',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          letterSpacing: 1.5,
                          color: AppColors.capMid,
                        ),
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

                  // ── Google button ────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: _handleGoogle,
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        side: BorderSide.none,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset('assets/google-icon.png', width: 20, height: 20),
                          const SizedBox(width: 10),
                          Text(
                            'Google',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Create account link ──────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Already have an account?  ",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pushNamed(context, '/login'),
                        child: Text(
                          'Sign In',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.moss,
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                            decorationColor: AppColors.moss,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}