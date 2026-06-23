import 'package:flutter/material.dart';

const praxisPurple = Color(0xFF5B2CFA);
const praxisPurpleDark = Color(0xFF3B16D9);
const praxisTeal = Color(0xFF008F86);
const praxisTealDark = Color(0xFF005B5F);
const praxisMint = Color(0xFFE8F7F4);
const praxisGold = Color(0xFFF7B928);
const praxisInk = Color(0xFF07122F);
const praxisText = Color(0xFF18284A);
const praxisMuted = Color(0xFF6B7897);
const praxisLine = Color(0xFFE4E9F2);
const praxisCanvas = Color(0xFFF7FAFD);
const praxisSurface = Color(0xFFFFFFFF);

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
        height: 1.05,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      headlineSmall: TextStyle(
        fontSize: 24,
        height: 1.2,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
        color: praxisInk,
      ),
      titleLarge: TextStyle(
        fontSize: 19,
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
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
        minimumSize: const Size(44, 46),
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
        minimumSize: const Size(44, 44),
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
