import 'package:flutter/material.dart';

import '../../ui/praxis_theme.dart';

Color contentStatusColor(String status) {
  return switch (status) {
    'posted' => const Color(0xFF009E73),
    'designed' => praxisPurple,
    'drafted' => praxisTealDark,
    _ => praxisMuted,
  };
}

Color contentCategoryTint(String category) {
  return switch (category) {
    'myth_buster' => const Color(0xFFFFF2E4),
    'symptoms' => const Color(0xFFE8F2FF),
    'procedure_explainer' => const Color(0xFFF3F0FF),
    'seasonal_health_tip' => const Color(0xFFE9F8EF),
    'clinic_service' => praxisMint,
    'faq' => const Color(0xFFFFEDF4),
    _ => const Color(0xFFF3F0FF),
  };
}

String formatShortDate(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}
