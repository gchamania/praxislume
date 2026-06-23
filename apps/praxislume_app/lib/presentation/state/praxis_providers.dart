import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/environment_settings.dart';
import '../../data/repositories/in_memory_praxis_repository.dart';
import '../../data/repositories/session_aware_praxis_repository.dart';
import '../../data/services/praxis_api_generation_client.dart';
import '../../domain/entities/praxis_models.dart';
import '../../domain/repositories/praxis_repository.dart';
import '../../domain/services/praxis_generation_client.dart';
import 'praxis_controller.dart';

final praxisRepositoryProvider = Provider<PraxisRepository>((ref) {
  final settings = SupabaseSettings.fromEnvironment();
  if (settings.isConfigured) {
    try {
      return SessionAwarePraxisRepository(Supabase.instance.client);
    } on StateError {
      return InMemoryPraxisRepository();
    }
  }
  return InMemoryPraxisRepository();
});

final praxisGenerationClientProvider = Provider<PraxisGenerationClient?>((ref) {
  final supabaseSettings = SupabaseSettings.fromEnvironment();
  final apiSettings = ApiSettings.fromEnvironment();
  if (!supabaseSettings.isConfigured || !apiSettings.isConfigured) {
    return null;
  }
  try {
    return PraxisApiGenerationClient(
      supabase: Supabase.instance.client,
      baseUrl: apiSettings.baseUrl,
    );
  } on StateError {
    return null;
  }
});

final praxisProvider = StateNotifierProvider<PraxisController, PraxisState>((
  ref,
) {
  return PraxisController(
    repository: ref.watch(praxisRepositoryProvider),
    generationClient: ref.watch(praxisGenerationClientProvider),
  );
});
