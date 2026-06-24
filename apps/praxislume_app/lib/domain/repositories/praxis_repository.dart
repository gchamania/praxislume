import 'dart:typed_data';

import '../entities/praxis_models.dart';

abstract class PraxisRepository {
  Future<PraxisState> load();

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
  });

  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  });

  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  });

  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  });

  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    String? caption,
    List<CarouselSlide>? carouselSlides,
  });
}
