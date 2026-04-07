import 'package:flutter/material.dart';

// ── InkBoard Color Palette ───────────────────────────────────────────────────
class AppColors {
  // Mushroom cap
  static const cap         = Color(0xFF2A2D2E);
  static const capMid      = Color(0xFF3D4244);

  // Stem / background
  static const stem        = Color(0xFFC8BFAE);
  static const stemLight   = Color(0xFFE4DDD0);
  static const stemBg      = Color(0xFFEDE8DF);  // page background

  // Ink
  static const ink         = Color(0xFF111410);
  static const inkWet      = Color(0xFF1E2118);

  // Moss / primary
  static const moss        = Color(0xFF4A5A3A);
  static const mossLight   = Color(0xFF6B7F54);
  static const mossDim     = Color(0xFF8FA070);

  // Forest
  static const forest      = Color(0xFF2E3D28);
  static const leaf        = Color(0xFFA8B890);

  // Soil / secondary
  static const soil        = Color(0xFF6B5540);
  static const soilLight   = Color(0xFF9E8268);

  // Mist
  static const mist        = Color(0xFFD8D4CA);
}

// ── InkBoard ThemeData ───────────────────────────────────────────────────────
class AppTheme {
  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.stemBg,

      colorScheme: const ColorScheme(
        brightness:       Brightness.light,
        primary:          AppColors.moss,        // buttons, active elements
        onPrimary:        AppColors.stemLight,   // text on primary
        secondary:        AppColors.soil,        // secondary actions
        onSecondary:      AppColors.stemBg,
        surface:          AppColors.stemBg,      // cards, dialogs
        onSurface:        AppColors.ink,         // text on surface
        error:            Color(0xFF8B3A1A),
        onError:          AppColors.stemLight,
      ),

      // ── Text theme (Lora + Raleway) ────────────────────────────────────────
      // Make sure you have these in your pubspec.yaml fonts section
      textTheme: const TextTheme(
        // Display / headings → Lora (serif)
        displayLarge:  TextStyle(fontFamily: 'Lora',   fontSize: 35, fontWeight: FontWeight.w700, color: AppColors.ink),
        displayMedium: TextStyle(fontFamily: 'Lora',   fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.ink),
        displaySmall:  TextStyle(fontFamily: 'Lora',   fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.ink),
        headlineMedium:TextStyle(fontFamily: 'Lora',   fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.ink),

        // Body / UI → Raleway (sans)
        bodyLarge:     TextStyle(fontFamily: 'Raleway', fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.ink),
        bodyMedium:    TextStyle(fontFamily: 'Raleway', fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.ink),
        bodySmall:     TextStyle(fontFamily: 'Raleway', fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.capMid),
        labelLarge:    TextStyle(fontFamily: 'Raleway', fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.stemLight, letterSpacing: 2.0),
        labelSmall:    TextStyle(fontFamily: 'Raleway', fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.mossLight, letterSpacing: 1.5),
      ),

    );
  }
}