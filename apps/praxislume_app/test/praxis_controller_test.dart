import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';

void main() {
  test('loads persisted Praxis state from repository', () async {
    final repository = RecordingPraxisRepository(
      initialState: PraxisState.initial().copyWith(
        isAuthenticated: true,
        clinic: const ClinicProfile(
          id: 'clinic-1',
          name: 'Saved Clinic',
          locality: 'Aundh',
          city: 'Pune',
          services: ['Acne care'],
          phone: '+91 98765 43210',
        ),
        doctor: const DoctorProfile(
          id: 'doctor-1',
          name: 'Dr Saved',
          qualifications: 'MBBS, MD',
          specialty: 'Dermatology',
        ),
      ),
    );
    final controller = PraxisController(repository: repository);

    await controller.load();

    expect(controller.state.isAuthenticated, isTrue);
    expect(controller.state.clinic?.name, 'Saved Clinic');
    expect(repository.loadCalls, 1);
  });

  test('persists onboarding through repository', () async {
    final repository = RecordingPraxisRepository();
    final controller = PraxisController(repository: repository);

    await controller.completeOnboarding(
      doctorName: 'Dr Asha Mehta',
      qualifications: 'MBBS, MD',
      clinicName: 'Asha Skin Clinic',
      locality: 'Aundh',
      city: 'Pune',
      services: ['Acne care', 'Skin allergy care'],
      phone: '+91 98765 43210',
    );

    expect(repository.onboardingSaveCalls, 1);
    expect(controller.state.clinic?.name, 'Asha Skin Clinic');
    expect(controller.state.doctor?.name, 'Dr Asha Mehta');
  });

  test('persists brand kit edits through repository', () async {
    final repository = RecordingPraxisRepository(
      initialState: PraxisState.initial().copyWith(
        isAuthenticated: true,
        clinic: const ClinicProfile(
          id: 'clinic-1',
          name: 'Asha Skin Clinic',
          locality: 'Aundh',
          city: 'Pune',
          services: ['Acne care'],
          phone: '+91 98765 43210',
        ),
      ),
    );
    final controller = PraxisController(repository: repository);

    await controller.updateBrandKit(
      primaryColor: '#123456',
      defaultCta: 'Book a skin consultation',
    );

    expect(repository.brandSaveCalls, 1);
    expect(controller.state.brandKit.primaryColor, '#123456');
    expect(controller.state.brandKit.defaultCta, 'Book a skin consultation');
  });

  test('persists generated campaign package through repository', () async {
    final repository = RecordingPraxisRepository(
      initialState: PraxisState.initial().copyWith(
        isAuthenticated: true,
        clinic: const ClinicProfile(
          id: 'clinic-1',
          name: 'Asha Skin Clinic',
          locality: 'Aundh',
          city: 'Pune',
          services: ['Acne care'],
          phone: '+91 98765 43210',
        ),
        doctor: const DoctorProfile(
          id: 'doctor-1',
          name: 'Dr Asha Mehta',
          qualifications: 'MBBS, MD',
          specialty: 'ENT',
        ),
      ),
    );
    final controller = PraxisController(repository: repository);

    await controller.load();
    await controller.generateThirtyDayCampaign();

    expect(repository.campaignSaveCalls, 1);
    expect(controller.state.campaign?.title, '30-day ENT Growth Campaign');
    expect(controller.state.campaign?.durationDays, 30);
    expect(controller.state.items, hasLength(30));
  });

  test('uses generation client when one is configured', () async {
    final repository = RecordingPraxisRepository(
      initialState: PraxisState.initial().copyWith(
        isAuthenticated: true,
        clinic: const ClinicProfile(
          id: 'clinic-1',
          name: 'Asha Skin Clinic',
          locality: 'Aundh',
          city: 'Pune',
          services: ['Acne care'],
          phone: '+91 98765 43210',
        ),
        doctor: const DoctorProfile(
          id: 'doctor-1',
          name: 'Dr Asha Mehta',
          qualifications: 'MBBS, MD',
          specialty: 'Dermatology',
        ),
      ),
    );
    final generationClient = RecordingGenerationClient();
    final controller = PraxisController(
      repository: repository,
      generationClient: generationClient,
    );

    await controller.load();
    await controller.generateThirtyDayCampaign();

    expect(generationClient.campaignPlanCalls, 1);
    expect(repository.campaignSaveCalls, 1);
    expect(controller.state.items, hasLength(30));
    expect(controller.state.items.first.title, 'API plan item 1');
    expect(controller.state.items.first.caption, 'API caption 1');
  });
}

class RecordingGenerationClient implements PraxisGenerationClient {
  int campaignPlanCalls = 0;

  @override
  Future<List<GeneratedCampaignPlanItem>> generateCampaignPlan({
    required PraxisState state,
    required int durationDays,
  }) async {
    campaignPlanCalls += 1;
    return List.generate(
      durationDays,
      (index) => GeneratedCampaignPlanItem(
        dayOffset: index,
        title: 'API plan item ${index + 1}',
        category: 'awareness',
        caption: 'API caption ${index + 1}',
        shortCta: state.brandKit.defaultCta,
        reelScript: 'API reel script ${index + 1}',
      ),
    );
  }

  @override
  Future<CaptionDraft> generateCaption({
    required String clinicId,
    required String title,
    required String specialty,
    required String tone,
    required List<String> keyPoints,
    required String ctaPreference,
    String? disclaimerPreference,
  }) async {
    return CaptionDraft(
      caption: 'API caption',
      shortCta: ctaPreference,
      disclaimerNeeded: true,
    );
  }

  @override
  Future<ReelScriptDraft> generateReelScript({
    required String clinicId,
    required String title,
    required String specialty,
    required String tone,
    required List<String> keyPoints,
    required String ctaPreference,
  }) async {
    return ReelScriptDraft(
      reelHook: 'API hook',
      reelScript: 'API reel',
      shortCta: ctaPreference,
    );
  }

  @override
  Future<String> rewriteTone({
    required String clinicId,
    required String content,
    required String tone,
  }) async {
    return 'API rewrite';
  }

  @override
  Future<ComplianceReviewDraft> reviewCompliance({
    required String clinicId,
    required String content,
    required String contentVersionHash,
  }) async {
    return ComplianceReviewDraft(
      status: 'flagged',
      issueCodes: const ['guarantee_claim'],
      notes: const ['Review claim language.'],
      reviewedContentVersionHash: contentVersionHash,
    );
  }
}

class RecordingPraxisRepository implements PraxisRepository {
  RecordingPraxisRepository({PraxisState? initialState})
    : storedState = initialState ?? PraxisState.initial();

  PraxisState storedState;
  int loadCalls = 0;
  int onboardingSaveCalls = 0;
  int brandSaveCalls = 0;
  int campaignSaveCalls = 0;

  @override
  Future<PraxisState> load() async {
    loadCalls += 1;
    return storedState;
  }

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
    onboardingSaveCalls += 1;
    storedState = currentState.copyWith(
      isAuthenticated: true,
      clinic: ClinicProfile(
        id: 'clinic-1',
        name: clinicName,
        locality: locality,
        city: city,
        services: services,
        phone: phone,
      ),
      doctor: DoctorProfile(
        id: 'doctor-1',
        name: doctorName,
        qualifications: qualifications,
        specialty: specialty,
      ),
    );
    return storedState;
  }

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) async {
    brandSaveCalls += 1;
    storedState = currentState.copyWith(brandKit: brandKit);
    return storedState;
  }

  @override
  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) async {
    storedState = currentState.copyWith(
      brandKit: currentState.brandKit.copyWith(
        logoPath: 'clinic-1/logo.$fileExtension',
      ),
    );
    return storedState;
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) async {
    campaignSaveCalls += 1;
    storedState = currentState.copyWith(campaign: campaign, items: items);
    return storedState;
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  }) async {
    storedState = currentState.copyWith(
      items: [
        for (final item in currentState.items)
          if (item.id == id)
            item.copyWith(caption: caption, status: 'drafted')
          else
            item,
      ],
    );
    return storedState;
  }
}
