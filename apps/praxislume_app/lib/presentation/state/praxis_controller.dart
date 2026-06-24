import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/campaign_package_generator.dart';
import '../../data/repositories/in_memory_praxis_repository.dart';
import '../../domain/entities/praxis_models.dart';
import '../../domain/repositories/praxis_repository.dart';
import '../../domain/services/praxis_generation_client.dart';

class PraxisController extends StateNotifier<PraxisState> {
  PraxisController({
    PraxisRepository? repository,
    PraxisGenerationClient? generationClient,
    CampaignPackageGenerator? campaignPackageGenerator,
    PraxisState? initialState,
  }) : _repository = repository ?? InMemoryPraxisRepository(),
       _generationClient = generationClient,
       _campaignPackageGenerator =
           campaignPackageGenerator ?? const CampaignPackageGenerator(),
       super(initialState ?? PraxisState.initial());

  final PraxisRepository _repository;
  final PraxisGenerationClient? _generationClient;
  final CampaignPackageGenerator _campaignPackageGenerator;

  bool get hasGenerationClient => _generationClient != null;

  Future<void> load() async {
    state = await _repository.load();
  }

  Future<void> signInDemo() async {
    final loadedState = await _repository.load();
    state = loadedState.copyWith(isAuthenticated: true);
  }

  void signOut() {
    state = PraxisState.initial();
  }

  Future<void> completeOnboarding({
    required String doctorName,
    required String qualifications,
    required String clinicName,
    required String locality,
    required String city,
    required List<String> services,
    required String phone,
    String specialty = 'Dermatology',
  }) async {
    state = await _repository.saveOnboarding(
      currentState: state,
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

  Future<void> generateThirtyDayCampaign() async {
    await generateCampaign(durationDays: 30);
  }

  Future<void> generateCampaign({required int durationDays}) async {
    final package = await _campaignPackageGenerator.generate(
      state: state,
      durationDays: durationDays,
      generationClient: _generationClient,
    );
    if (package == null) {
      return;
    }

    state = await _repository.saveCampaignPackage(
      currentState: state,
      campaign: package.campaign,
      items: package.items,
    );
  }

  Future<void> updateContentItem(String id, {required String caption}) async {
    state = await _repository.updateContentItem(
      currentState: state,
      id: id,
      caption: caption,
    );
  }

  Future<void> updateBrandKit({
    String? primaryColor,
    String? secondaryColor,
    String? accentColor,
    String? tone,
    String? defaultCta,
    String? disclaimer,
  }) async {
    state = await _repository.saveBrandKit(
      currentState: state,
      brandKit: state.brandKit.copyWith(
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        accentColor: accentColor,
        tone: tone,
        defaultCta: defaultCta,
        disclaimer: disclaimer,
      ),
    );
  }

  Future<void> uploadBrandLogo({
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) async {
    state = await _repository.saveBrandLogo(
      currentState: state,
      bytes: bytes,
      fileExtension: fileExtension,
      contentType: contentType,
    );
  }

  Future<GeneratedVisualAsset?> generateVisualAssetForItem(
    String itemId,
  ) async {
    final generationClient = _generationClient;
    if (generationClient == null) {
      return null;
    }
    final item = state.items.firstWhere((candidate) => candidate.id == itemId);
    final asset = await generationClient.generateVisualAsset(
      state: state,
      item: item,
    );
    state = state.copyWith(
      visualAssetsByContentId: {
        ...state.visualAssetsByContentId,
        item.id: asset,
      },
    );
    return asset;
  }
}
