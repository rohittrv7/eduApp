import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors matching Web App (#1a56db)
  static const Color primary = Color(0xFF1A56DB); // Royal Blue
  static const Color primaryDark = Color(0xFF1E40AF);
  static const Color secondary = Color(0xFF3B82F6); // Blue 500
  static const Color background = Color(0xFFF9FAFB); // Gray 50
  static const Color surface = Colors.white;
  static const Color border = Color(0xFFE5E7EB); // Gray 200
  static const Color textPrimary = Color(0xFF111827); // Gray 900
  static const Color textSecondary = Color(0xFF6B7280); // Gray 500
  static const Color accentFlame = Color(0xFFF97316); // Orange for streak
  static const Color accentTrophy = Color(0xFFEAB308); // Yellow for leaderboard
  static const Color accentPurple = Color(0xFFA855F7); // Purple for rank

  // Role Theme Colors matching Web App:
  // Student: Royal Blue (0xFF1A56DB)
  // Teacher: Emerald Green (0xFF059669)
  // Admin: Obsidian Slate (0xFF0F172A) & Violet (0xFF7C3AED)
  static Color getPrimaryForRole(String? role) {
    if (role == 'teacher') return const Color(0xFF059669);
    if (role == 'admin') return const Color(0xFF7C3AED);
    return const Color(0xFF1A56DB);
  }

  static Color getSecondaryForRole(String? role) {
    if (role == 'teacher') return const Color(0xFF047857);
    if (role == 'admin') return const Color(0xFF0F172A);
    return const Color(0xFF4F46E5);
  }

  static ThemeData get lightTheme {
    final base = ThemeData.light(useMaterial3: true);
    
    return base.copyWith(
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        background: background,
        surface: surface,
        error: Colors.redAccent,
      ),
      scaffoldBackgroundColor: background,
      
      // Text styling mapped from google_fonts
      textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w900,
          color: textPrimary,
        ),
        displayMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w800,
          color: textPrimary,
        ),
        displaySmall: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineSmall: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        titleSmall: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(
          color: textPrimary,
          fontSize: 16.0,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          color: textSecondary,
          fontSize: 14.0,
        ),
        bodySmall: GoogleFonts.plusJakartaSans(
          color: textSecondary,
          fontSize: 12.0,
        ),
      ),

      // Card default styling
      cardTheme: const CardThemeData(
        color: surface,
        elevation: 0.5,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: border),
          borderRadius: BorderRadius.all(Radius.circular(20.0)),
        ),
      ),

      // Input Field styling
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFFF1F5F9), // Slate 100
        contentPadding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(16.0)),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(16.0)),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(16.0)),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        labelStyle: TextStyle(fontWeight: FontWeight.bold, color: textSecondary),
      ),

      // Elevated Buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0.0,
          padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 24.0),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16.0)),
          ),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            fontSize: 15.0,
          ),
        ),
      ),
    );
  }
}
