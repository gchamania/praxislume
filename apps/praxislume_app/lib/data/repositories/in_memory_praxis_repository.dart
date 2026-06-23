import 'dart:typed_data';

import '../../core/utils/uuid_helpers.dart';
import '../../domain/entities/praxis_models.dart';
import '../../domain/repositories/praxis_repository.dart';

class InMemoryPraxisRepository implements PraxisRepository {
  InMemoryPraxisRepository({PraxisState? initialState})
    : _state = initialState ?? PraxisState.initial();

  PraxisState _state;

  @override
  Future<PraxisState> load() async => _state;

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
  }) async {
    _state = currentState.copyWith(
      isAuthenticated: true,
      clinic: ClinicProfile(
        id: currentState.clinic?.id.isNotEmpty == true
            ? currentState.clinic!.id
            : newUuid(),
        name: clinicName,
        locality: locality,
        city: city,
        services: services,
        phone: phone,
      ),
      doctor: DoctorProfile(
        id: currentState.doctor?.id.isNotEmpty == true
            ? currentState.doctor!.id
            : newUuid(),
        name: doctorName,
        qualifications: qualifications,
        specialty: specialty,
      ),
    );
    return _state;
  }

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) async {
    _state = currentState.copyWith(brandKit: brandKit);
    return _state;
  }

  @override
  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) async {
    final clinicId = currentState.clinic?.id;
    final path = clinicId == null || clinicId.isEmpty
        ? 'demo/logo.$fileExtension'
        : '$clinicId/logo.$fileExtension';
    _state = currentState.copyWith(
      brandKit: currentState.brandKit.copyWith(logoPath: path),
    );
    return _state;
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) async {
    _state = currentState.copyWith(campaign: campaign, items: items);
    return _state;
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  }) async {
    _state = currentState.copyWith(
      items: [
        for (final item in currentState.items)
          if (item.id == id)
            item.copyWith(caption: caption, status: 'drafted')
          else
            item,
      ],
    );
    return _state;
  }
}
