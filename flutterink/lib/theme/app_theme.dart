import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    // Seed with Material's default textTheme so all styles have correct
    // inherit values — prevents TextStyle lerp errors during animations
    final base = GoogleFonts.ralewayTextTheme(ThemeData.light().textTheme);

    // Lora is used for large display/heading text (matches web frontend)
    final loraHeading = GoogleFonts.lora(
      color: AppColors.textPrimary,
      fontWeight: FontWeight.bold,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accent,
        surface: AppColors.background,
      ),

      scaffoldBackgroundColor: AppColors.background,

      // Apply Raleway as the default font across the whole app
      textTheme: base.copyWith(
        // Large headings (used in onboarding, screen titles) → Lora
        displayLarge:  loraHeading.copyWith(fontSize: 57),
        displayMedium: loraHeading.copyWith(fontSize: 45),
        displaySmall:  loraHeading.copyWith(fontSize: 36),
        headlineLarge: loraHeading.copyWith(fontSize: 32),
        headlineMedium: loraHeading.copyWith(fontSize: 28),
        headlineSmall:  loraHeading.copyWith(fontSize: 24),

        // Body + labels → Raleway (inherited from base)
        bodyLarge:   GoogleFonts.raleway(fontSize: 16, color: AppColors.textPrimary),
        bodyMedium:  GoogleFonts.raleway(fontSize: 14, color: AppColors.textPrimary),
        bodySmall:   GoogleFonts.raleway(fontSize: 12, color: AppColors.textMuted),
        labelLarge:  GoogleFonts.raleway(fontSize: 15, fontWeight: FontWeight.w600),
        labelMedium: GoogleFonts.raleway(fontSize: 13, color: AppColors.textMuted),
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: GoogleFonts.lora(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        iconTheme: const IconThemeData(color: AppColors.accent),
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.accent,
          side: const BorderSide(color: AppColors.accent),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        labelStyle: GoogleFonts.raleway(color: AppColors.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
      ),
    );
  }
}
