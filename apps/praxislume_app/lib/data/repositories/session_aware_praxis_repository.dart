import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../domain/entities/praxis_models.dart';
import '../../domain/repositories/praxis_repository.dart';
import 'in_memory_praxis_repository.dart';
import 'supabase_praxis_repository.dart';

class SessionAwarePraxisRepository implements PraxisRepository {
  SessionAwarePraxisRepository(this._client)
    : _fallback = InMemoryPraxisRepository();

  final SupabaseClient _client;
  final InMemoryPraxisRepository _fallback;

  PraxisRepository get _activeRepository => _client.auth.currentUser == null
      ? _fallback
      : SupabasePraxisRepository(_client);

  @override
  Future<PraxisState> load() => _activeRepository.load();

  @override
  Future<PraxisState> saveOnboarding({
    required PraxisState currentState,
    required String doctorName,
    required String qualifications,
    required String specialty,
    required String clinicName,
    required String locality,
    required String city,
    required List<String> services,
    required String phone,
  }) {
    return _activeRepository.saveOnboarding(
      currentState: currentState,
      doctorName: doctorName,
      qualifications: qualifications,
      specialty: specialty,
      clinicName: clinicName,
      locality: locality,
      city: city,
      services: services,
      phone: phone,
    );
  }

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) {
    return _activeRepository.saveBrandKit(
      currentState: currentState,
      brandKit: brandKit,
    );
  }

  @override
  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) {
    return _activeRepository.saveBrandLogo(
      currentState: currentState,
      bytes: bytes,
      fileExtension: fileExtension,
      contentType: contentType,
    );
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) {
    return _activeRepository.saveCampaignPackage(
      currentState: currentState,
      campaign: campaign,
      items: items,
    );
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  }) {
    return _activeRepository.updateContentItem(
      currentState: currentState,
      id: id,
      caption: caption,
    );
  }
}
