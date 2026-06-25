import 'package:flutter/material.dart';

const praxisPurple = Color(0xFF5B2CFA);
const praxisPurpleDark = Color(0xFF4C1DDF);
const praxisTeal = Color(0xFF0AA98F);
const praxisTealDark = Color(0xFF006B5D);
const praxisMint = Color(0xFFE7F8F5);
const praxisGold = Color(0xFFFFB020);
const praxisInk = Color(0xFF07122F);
const praxisText = Color(0xFF17264A);
const praxisMuted = Color(0xFF64748B);
const praxisLine = Color(0xFFE2E8F0);
const praxisCanvas = Color(0xFFF8FAFC);
const praxisSurface = Color(0xFFFFFFFF);
const praxisSidebarActive = Color(0xFFF3F0FF);
const praxisSoftPurple = Color(0xFFF5F1FF);
const praxisSoftBlue = Color(0xFFEAF4FF);
const praxisSoftOrange = Color(0xFFFFF4E5);

ThemeData buildPraxisTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: praxisCanvas,
    colorScheme: ColorScheme.fromSeed(
      seedColor: praxisPurple,
      primary: praxisPurple,
      secondary: praxisTeal,
      surface: praxisSurface,
      error: const Color(0xFFE03131),
    ),
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        fontSize: 34,
        height: 1.08,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      headlineMedium: TextStyle(
        fontSize: 30,
        height: 1.12,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      headlineSmall: TextStyle(
        fontSize: 25,
        height: 1.2,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      titleLarge: TextStyle(
        fontSize: 20,
        height: 1.25,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      titleMedium: TextStyle(
        fontSize: 15,
        height: 1.3,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
        color: praxisInk,
      ),
      bodyLarge: TextStyle(
        fontSize: 15,
        height: 1.45,
        letterSpacing: 0,
        color: praxisText,
      ),
      bodyMedium: TextStyle(
        fontSize: 13,
        height: 1.45,
        letterSpacing: 0,
        color: praxisText,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        height: 1.4,
        letterSpacing: 0,
        color: praxisMuted,
      ),
      labelLarge: TextStyle(
        fontSize: 13,
        height: 1.2,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: praxisSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: praxisLine),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: praxisLine),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: praxisPurple, width: 1.4),
      ),
    ),
    cardTheme: CardThemeData(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: praxisSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: praxisLine),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: praxisPurple,
        foregroundColor: Colors.white,
        minimumSize: const Size(44, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: 0,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: praxisPurple,
        side: const BorderSide(color: praxisLine),
        minimumSize: const Size(44, 46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: praxisPurple,
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
        ),
      ),
    ),
  );
}

Color parseBrandColor(String value, {Color fallback = praxisTealDark}) {
  final normalized = value.trim().replaceFirst('#', '');
  if (normalized.length != 6) {
    return fallback;
  }
  final parsed = int.tryParse(normalized, radix: 16);
  return parsed == null ? fallback : Color(0xFF000000 | parsed);
}
