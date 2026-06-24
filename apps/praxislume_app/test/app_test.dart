import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';
import 'package:praxislume_app/presentation/screens/content/content_detail_screen.dart';

void main() {
  testWidgets('routes anonymous users to sign in', (tester) async {
    await tester.pumpWidget(const PraxisLumeApp());

    expect(find.text('PraxisLume'), findsOneWidget);
    expect(find.text('Sign in to continue'), findsOneWidget);
    expect(find.text('Sign in'), findsWidgets);
    expect(find.text('Your Doctor Growth OS.'), findsOneWidget);
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.text('Continue with Apple'), findsOneWidget);
  });

  testWidgets('shows Supabase sign in form and local configuration fallback', (
    tester,
  ) async {
    await tester.pumpWidget(const PraxisLumeApp());

    expect(find.byKey(const Key('emailField')), findsOneWidget);
    expect(find.byKey(const Key('passwordField')), findsOneWidget);

    await tester.enterText(
      find.byKey(const Key('emailField')),
      'doctor@example.com',
    );
    await tester.enterText(find.byKey(const Key('passwordField')), 'password');
    final signInButton = find.widgetWithText(FilledButton, 'Sign in');
    await tester.ensureVisible(signInButton);
    await tester.tap(signInButton);
    await tester.pump(const Duration(milliseconds: 200));

    expect(
      find.text('Supabase is not configured for this build'),
      findsOneWidget,
    );
  });

  testWidgets('validates onboarding before dashboard', (tester) async {
    await tester.pumpWidget(const PraxisLumeApp());

    await tester.ensureVisible(find.text('Use demo account'));
    await tester.tap(find.text('Use demo account'));
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 7'), findsWidgets);
    expect(find.text('Specialty and focus areas'), findsOneWidget);

    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('Specialty is required'), findsOneWidget);

    await tester.enterText(
      find.byKey(const Key('specialtyField')),
      'Dermatology',
    );
    await tester.enterText(
      find.byKey(const Key('servicesField')),
      'Acne care, Skin allergy care',
    );
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Clinic details'), findsOneWidget);
    await tester.enterText(
      find.byKey(const Key('clinicNameField')),
      'Asha Skin Clinic',
    );
    await tester.enterText(find.byKey(const Key('localityField')), 'Aundh');
    await tester.enterText(find.byKey(const Key('cityField')), 'Pune');
    await tester.enterText(
      find.byKey(const Key('phoneField')),
      '+91 98765 43210',
    );
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Doctor profile'), findsOneWidget);
    await tester.enterText(
      find.byKey(const Key('doctorNameField')),
      'Dr Asha Mehta',
    );
    await tester.enterText(
      find.byKey(const Key('qualificationsField')),
      'MBBS, MD',
    );
    for (var i = 0; i < 4; i++) {
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();
    }
    expect(find.text('Ready to launch'), findsWidgets);
    await tester.tap(find.text('Complete onboarding'));
    await tester.pumpAndSettle();

    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Asha Skin Clinic'), findsOneWidget);
  });

  testWidgets('generates, edits, and copies a campaign item', (tester) async {
    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(
      tester,
      specialty: 'ENT',
      clinicName: 'Praxis ENT Clinic',
      services: 'Sinus consultation, Ear infection care',
    );

    await _tapWorkspaceNav(tester, 'Generate Content');
    await tester.pumpAndSettle();
    expect(find.text('Content Conveyor Belt'), findsWidgets);
    await tester.ensureVisible(find.byKey(const Key('generateCampaignButton')));
    await tester.tap(find.byKey(const Key('generateCampaignButton')));
    await tester.pumpAndSettle();

    expect(find.text('Campaign Ready'), findsWidgets);
    expect(find.text('30-day ENT Growth Campaign'), findsOneWidget);
    expect(find.textContaining('Content ideas: 30'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const Key('approveCampaignButton')));
    await tester.tap(find.byKey(const Key('approveCampaignButton')));
    await tester.pumpAndSettle();
    expect(find.text('Calendar'), findsWidgets);

    await tester.tap(find.byKey(const Key('reviewFirstContentButton')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('captionField')),
      'Edited caption for patient education.',
    );
    await tester.ensureVisible(find.text('Save item'));
    await tester.tap(find.text('Save item'));
    await tester.pump(const Duration(milliseconds: 200));
    await tester.ensureVisible(find.text('Copy post package'));
    await tester.tap(find.text('Copy post package'));
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Post package copied'), findsOneWidget);
    expect(
      find.text('AI thumbnail generation requires backend API.'),
      findsOneWidget,
    );
  });

  testWidgets('shows generated AI thumbnail returned by the backend client', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 1600);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final repository = RecordingPraxisRepository(
      initialState: _contentDetailState(),
    );
    final generationClient = RecordingGenerationClient();
    final controller = PraxisController(
      repository: repository,
      generationClient: generationClient,
      initialState: _contentDetailState(),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [praxisProvider.overrideWith((ref) => controller)],
        child: const MaterialApp(home: ContentDetailScreen(itemId: 'item-1')),
      ),
    );

    await tester.ensureVisible(
      find.byKey(const Key('generateThumbnailButton')),
    );
    await tester.tap(find.byKey(const Key('generateThumbnailButton')));
    await tester.pumpAndSettle();

    expect(generationClient.visualAssetCalls, 1);
    expect(find.text('AI thumbnail ready'), findsWidgets);
    expect(find.byKey(const Key('generatedThumbnailPreview')), findsOneWidget);
  });

  testWidgets('generates and exports a v0.3 branded carousel package', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 3000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final repository = RecordingPraxisRepository(
      initialState: _contentDetailState(),
    );
    final generationClient = RecordingGenerationClient();
    final controller = PraxisController(
      repository: repository,
      generationClient: generationClient,
      initialState: _contentDetailState(),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [praxisProvider.overrideWith((ref) => controller)],
        child: const MaterialApp(home: ContentDetailScreen(itemId: 'item-1')),
      ),
    );

    await tester.ensureVisible(find.byKey(const Key('generateCarouselButton')));
    await tester.tap(find.byKey(const Key('generateCarouselButton')));
    await tester.pumpAndSettle();

    expect(generationClient.carouselCalls, 1);
    expect(find.text('Carousel Studio v0.3'), findsOneWidget);
    expect(find.byKey(const Key('carouselSlidePreview-1')), findsOneWidget);
    expect(find.text('General education'), findsWidgets);

    await tester.ensureVisible(
      find.byKey(const Key('copyCarouselPackageButton')),
    );
    await tester.tap(find.byKey(const Key('copyCarouselPackageButton')));
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Carousel package copied'), findsOneWidget);
  });

  testWidgets('saves brand kit and shows deterministic preview', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1200, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(tester);

    await _tapWorkspaceNav(tester, 'Brand');
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('primaryColorField')),
      '#123456',
    );
    await tester.enterText(
      find.byKey(const Key('ctaField')),
      'Book a skin consultation',
    );
    final saveBrandKit = find.text('Save Changes');
    await tester.ensureVisible(saveBrandKit);
    await tester.tap(saveBrandKit);
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Brand kit saved'), findsOneWidget);
    expect(find.text('Book a skin consultation'), findsWidgets);
  });

  testWidgets('renders redesigned workspace routes and future placeholders', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1200, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(tester);

    await tester.tap(find.text('Generate Content'));
    await tester.pumpAndSettle();
    expect(find.text('Content Conveyor Belt'), findsWidgets);

    await tester.tap(find.text('Content Library'));
    await tester.pumpAndSettle();
    expect(find.text('All your content in one place.'), findsOneWidget);
    expect(find.byKey(const Key('librarySearchField')), findsOneWidget);
    expect(find.text('Grid'), findsOneWidget);

    await _tapWorkspaceNav(tester, 'Carousels');
    await tester.pumpAndSettle();
    expect(find.text('Carousel Studio'), findsWidgets);

    await _tapWorkspaceNav(tester, 'Templates');
    await tester.pumpAndSettle();
    expect(
      find.text('Preview only / deferred after MVP validation'),
      findsOneWidget,
    );

    await _tapWorkspaceNav(tester, 'Analytics');
    await tester.pumpAndSettle();
    expect(
      find.text('Preview only / deferred after MVP validation'),
      findsOneWidget,
    );

    await _tapWorkspaceNav(tester, 'Media Studio');
    await tester.pumpAndSettle();
    expect(
      find.text('Preview only / deferred after MVP validation'),
      findsOneWidget,
    );
  });

  testWidgets('mobile workspace routes use drawer navigation cleanly', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(tester);
    expect(tester.takeException(), isNull);

    expect(find.text('Asha Skin Clinic'), findsOneWidget);

    await _openMobileDrawer(tester);
    await _tapWorkspaceNav(tester, 'Generate Content');
    await tester.pumpAndSettle();
    expect(find.text('Content Conveyor Belt'), findsWidgets);
    expect(tester.takeException(), isNull);

    await _openMobileDrawer(tester);
    await _tapWorkspaceNav(tester, 'Content Library');
    await tester.pumpAndSettle();
    expect(find.text('All your content in one place.'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await _openMobileDrawer(tester);
    await _tapWorkspaceNav(tester, 'Brand');
    await tester.pumpAndSettle();
    expect(find.text('Brand Settings'), findsWidgets);
    expect(tester.takeException(), isNull);

    await _openMobileDrawer(tester);
    await _tapWorkspaceNav(tester, 'Settings');
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsWidgets);

    expect(tester.takeException(), isNull);
  });
}

Future<void> _completeDemoOnboarding(
  WidgetTester tester, {
  String specialty = 'Dermatology',
  String clinicName = 'Asha Skin Clinic',
  String services = 'Acne care, Skin allergy care',
}) async {
  await tester.ensureVisible(find.text('Use demo account'));
  await tester.tap(find.text('Use demo account'));
  await tester.pumpAndSettle();
  await tester.enterText(find.byKey(const Key('specialtyField')), specialty);
  await tester.enterText(find.byKey(const Key('servicesField')), services);
  await tester.tap(find.text('Next'));
  await tester.pumpAndSettle();
  await tester.enterText(find.byKey(const Key('clinicNameField')), clinicName);
  await tester.enterText(find.byKey(const Key('localityField')), 'Aundh');
  await tester.enterText(find.byKey(const Key('cityField')), 'Pune');
  await tester.enterText(
    find.byKey(const Key('phoneField')),
    '+91 98765 43210',
  );
  await tester.tap(find.text('Next'));
  await tester.pumpAndSettle();
  await tester.enterText(
    find.byKey(const Key('doctorNameField')),
    'Dr Asha Mehta',
  );
  await tester.enterText(
    find.byKey(const Key('qualificationsField')),
    'MBBS, MD',
  );
  for (var i = 0; i < 4; i++) {
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
  }
  await tester.ensureVisible(find.text('Complete onboarding'));
  await tester.tap(find.text('Complete onboarding'));
  await tester.pumpAndSettle();
}

Future<void> _openMobileDrawer(WidgetTester tester) async {
  final scaffold = tester.state<ScaffoldState>(find.byType(Scaffold).last);
  scaffold.openDrawer();
  await tester.pumpAndSettle();
}

Future<void> _tapWorkspaceNav(WidgetTester tester, String label) async {
  final navItem = find.widgetWithText(InkWell, label).last;
  await tester.ensureVisible(navItem);
  await tester.tap(navItem);
}

class RecordingGenerationClient implements PraxisGenerationClient {
  int visualAssetCalls = 0;
  int carouselCalls = 0;

  @override
  Future<List<GeneratedCampaignPlanItem>> generateCampaignPlan({
    required PraxisState state,
    required int durationDays,
  }) async {
    return const [];
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

  @override
  Future<GeneratedVisualAsset> generateVisualAsset({
    required PraxisState state,
    required ContentItem item,
  }) async {
    visualAssetCalls += 1;
    return const GeneratedVisualAsset(
      assetId: 'asset-1',
      storagePath: 'clinic-1/assets/item-1-thumbnail.png',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      signedUrl: 'https://storage.example.test/signed/asset.png',
      expiresInSeconds: 300,
    );
  }

  @override
  Future<List<CarouselSlide>> generateCarouselSlides({
    required PraxisState state,
    required ContentItem item,
    required int slideCount,
  }) async {
    carouselCalls += 1;
    return const [
      CarouselSlide(
        slideNumber: 1,
        role: 'cover',
        headline: 'Sinus care basics',
        body: 'A simple patient-education carousel from the clinic.',
        visualCue: 'Soft ENT abstract cover',
      ),
      CarouselSlide(
        slideNumber: 2,
        role: 'education',
        headline: 'Why symptoms persist',
        body: 'Recurring symptoms deserve a qualified ENT review.',
        visualCue: 'Checklist card',
      ),
      CarouselSlide(
        slideNumber: 3,
        role: 'education',
        headline: 'When to consult',
        body: 'Do not ignore symptoms that keep coming back.',
        visualCue: 'Calendar marker',
      ),
      CarouselSlide(
        slideNumber: 4,
        role: 'cta',
        headline: 'Need help?',
        body: 'Book an ENT consultation.',
        visualCue: 'Clinic CTA footer',
      ),
      CarouselSlide(
        slideNumber: 5,
        role: 'disclaimer',
        headline: 'General education',
        body: 'For general education only.',
        visualCue: 'Disclaimer strip',
      ),
    ];
  }
}

class RecordingPraxisRepository implements PraxisRepository {
  RecordingPraxisRepository({required this.initialState});

  final PraxisState initialState;

  @override
  Future<PraxisState> load() async => initialState;

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
    return currentState;
  }

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) async {
    return currentState.copyWith(brandKit: brandKit);
  }

  @override
  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) async {
    return currentState;
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) async {
    return currentState.copyWith(campaign: campaign, items: items);
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    String? caption,
    List<CarouselSlide>? carouselSlides,
  }) async {
    return currentState.copyWith(
      items: [
        for (final item in currentState.items)
          if (item.id == id)
            item.copyWith(caption: caption, carouselSlides: carouselSlides)
          else
            item,
      ],
    );
  }
}

PraxisState _contentDetailState() {
  return PraxisState.initial().copyWith(
    isAuthenticated: true,
    clinic: const ClinicProfile(
      id: 'clinic-1',
      name: 'Praxis ENT Clinic',
      locality: 'Aundh',
      city: 'Pune',
      services: ['Sinus consultation'],
      phone: '+91 98765 43210',
    ),
    doctor: const DoctorProfile(
      id: 'doctor-1',
      name: 'Dr Asha Mehta',
      qualifications: 'MBBS, MS',
      specialty: 'ENT',
    ),
    campaign: ContentCampaign(
      id: 'campaign-1',
      title: '30-day ENT Growth Campaign',
      goal: 'increase appointment enquiries',
      durationDays: 30,
      startDate: DateTime(2026, 6, 24),
    ),
    items: const [
      ContentItem(
        id: 'item-1',
        campaignId: 'campaign-1',
        dayOffset: 0,
        title: 'Sinus care basics',
        category: 'awareness',
        status: 'drafted',
        caption: 'General education caption.',
        shortCta: 'Book an ENT consultation',
        reelScript: 'Explain one safe care tip.',
      ),
    ],
  );
}
