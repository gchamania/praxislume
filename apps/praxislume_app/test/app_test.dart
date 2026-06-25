import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';
import 'package:praxislume_app/presentation/router/praxis_router.dart';

void main() {
  testWidgets('routes anonymous users to sign in', (tester) async {
    await tester.pumpWidget(const PraxisLumeApp());

    expect(find.text('PraxisLume'), findsOneWidget);
    expect(find.text('Sign in to continue'), findsOneWidget);
    expect(find.text('Sign in'), findsWidgets);
    expect(find.text('Your Doctor Growth OS.'), findsOneWidget);
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
    await tester.tap(find.text('Sign in'));
    await tester.pump(const Duration(milliseconds: 200));

    expect(
      find.text('Supabase is not configured for this build'),
      findsOneWidget,
    );
  });

  testWidgets('validates onboarding before dashboard', (tester) async {
    await tester.pumpWidget(const PraxisLumeApp());

    await tester.tap(find.text('Use demo account'));
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 7'), findsOneWidget);
    expect(find.text('Doctor and clinic profile'), findsOneWidget);

    await tester.tap(find.text('Complete onboarding'));
    await tester.pumpAndSettle();

    expect(find.text('Doctor name is required'), findsOneWidget);

    await tester.enterText(
      find.byKey(const Key('doctorNameField')),
      'Dr Asha Mehta',
    );
    await tester.enterText(
      find.byKey(const Key('qualificationsField')),
      'MBBS, MD',
    );
    await tester.enterText(
      find.byKey(const Key('specialtyField')),
      'Dermatology',
    );
    await tester.enterText(
      find.byKey(const Key('clinicNameField')),
      'Asha Skin Clinic',
    );
    await tester.enterText(find.byKey(const Key('localityField')), 'Aundh');
    await tester.enterText(find.byKey(const Key('cityField')), 'Pune');
    await tester.enterText(
      find.byKey(const Key('servicesField')),
      'Acne care, Skin allergy care',
    );
    await tester.enterText(
      find.byKey(const Key('phoneField')),
      '+91 98765 43210',
    );
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

    await tester.tap(find.text('Calendar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Generate 30-day campaign'));
    await tester.pumpAndSettle();

    expect(find.text('30-day ENT Growth Campaign'), findsOneWidget);
    expect(find.textContaining('Content ideas: 30'), findsOneWidget);

    await tester.tap(find.text('Day 1'));
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
      find.text('Image generation pilot is unavailable in this build.'),
      findsOneWidget,
    );
    final visualButton = tester.widget<OutlinedButton>(
      find.byKey(const Key('generateVisualAssetButton')),
    );
    expect(visualButton.onPressed, isNull);
  });

  testWidgets(
    'generates and previews a branded visual asset when API client exists',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(1200, 1200));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final generationClient = RecordingVisualGenerationClient();
      final item = const ContentItem(
        id: 'content-1',
        campaignId: 'campaign-1',
        dayOffset: 0,
        title: 'Sinus care basics',
        category: 'awareness',
        status: 'drafted',
        caption: 'General education caption.',
        shortCta: 'Book an ENT consultation',
        reelScript: 'Explain safe sinus care basics.',
      );
      final initialState = PraxisState.initial().copyWith(
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
          qualifications: 'MBBS, MS ENT',
          specialty: 'ENT',
        ),
        campaign: ContentCampaign(
          id: 'campaign-1',
          title: '30-day ENT Growth Campaign',
          goal: 'appointments',
          durationDays: 30,
          startDate: DateTime(2026, 6, 24),
        ),
        items: [item],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            praxisRepositoryProvider.overrideWithValue(
              InMemoryPraxisRepository(initialState: initialState),
            ),
            praxisGenerationClientProvider.overrideWithValue(generationClient),
          ],
          child: const PraxisRouterApp(),
        ),
      );

      await tester.tap(find.text('Use demo account'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Content Library'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sinus care basics').first);
      await tester.pumpAndSettle();
      await tester.ensureVisible(
        find.byKey(const Key('generateVisualAssetButton')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('generateVisualAssetButton')));
      await tester.pumpAndSettle();

      expect(generationClient.visualAssetCalls, 1);
      expect(find.text('Generated branded asset ready'), findsOneWidget);
      expect(find.text('Branded asset generated'), findsOneWidget);
    },
  );

  testWidgets('saves brand kit and shows deterministic preview', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1200, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(tester);

    await tester.tap(find.text('Brand'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('primaryColorField')),
      '#123456',
    );
    await tester.enterText(
      find.byKey(const Key('ctaField')),
      'Book a skin consultation',
    );
    await tester.tap(find.text('Save brand kit'));
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Brand kit saved'), findsOneWidget);
    expect(find.text('Book a skin consultation'), findsWidgets);
  });

  testWidgets('renders redesigned workspace routes and future placeholders', (
    tester,
  ) async {
    await tester.pumpWidget(const PraxisLumeApp());
    await _completeDemoOnboarding(tester);

    await tester.tap(find.text('Generate Content'));
    await tester.pumpAndSettle();
    expect(find.text('Content Conveyor Belt'), findsOneWidget);

    await tester.tap(find.text('Content Library'));
    await tester.pumpAndSettle();
    expect(find.text('All your content in one place.'), findsOneWidget);

    await tester.tap(find.text('Templates'));
    await tester.pumpAndSettle();
    expect(
      find.text('Templates are planned after MVP validation.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Analytics'));
    await tester.pumpAndSettle();
    expect(
      find.text('Analytics arrive after pilot usage data exists.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Media Studio'));
    await tester.pumpAndSettle();
    expect(find.text('Media Studio is outside the MVP.'), findsOneWidget);
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

    expect(find.text('Asha Skin Clinic'), findsOneWidget);

    await _openMobileDrawer(tester);
    await tester.tap(find.text('Generate Content'));
    await tester.pumpAndSettle();
    expect(find.text('Content Conveyor Belt'), findsOneWidget);

    await _openMobileDrawer(tester);
    await tester.tap(find.text('Content Library'));
    await tester.pumpAndSettle();
    expect(find.text('All your content in one place.'), findsOneWidget);

    await _openMobileDrawer(tester);
    await tester.tap(find.text('Brand'));
    await tester.pumpAndSettle();
    expect(find.text('Brand Settings'), findsOneWidget);

    await _openMobileDrawer(tester);
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsOneWidget);

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
  await tester.enterText(
    find.byKey(const Key('doctorNameField')),
    'Dr Asha Mehta',
  );
  await tester.enterText(
    find.byKey(const Key('qualificationsField')),
    'MBBS, MD',
  );
  await tester.enterText(find.byKey(const Key('specialtyField')), specialty);
  await tester.enterText(find.byKey(const Key('clinicNameField')), clinicName);
  await tester.enterText(find.byKey(const Key('localityField')), 'Aundh');
  await tester.enterText(find.byKey(const Key('cityField')), 'Pune');
  await tester.enterText(find.byKey(const Key('servicesField')), services);
  await tester.enterText(
    find.byKey(const Key('phoneField')),
    '+91 98765 43210',
  );
  await tester.ensureVisible(find.text('Complete onboarding'));
  await tester.tap(find.text('Complete onboarding'));
  await tester.pumpAndSettle();
}

Future<void> _openMobileDrawer(WidgetTester tester) async {
  final scaffold = tester.state<ScaffoldState>(find.byType(Scaffold).last);
  scaffold.openDrawer();
  await tester.pumpAndSettle();
}

class RecordingVisualGenerationClient implements PraxisGenerationClient {
  int visualAssetCalls = 0;

  @override
  Future<GeneratedVisualAsset> generateVisualAsset({
    required PraxisState state,
    required ContentItem item,
  }) async {
    visualAssetCalls += 1;
    return const GeneratedVisualAsset(
      assetId: 'asset-1',
      storagePath: 'clinic-1/assets/final.svg',
      mimeType: 'image/svg+xml',
      width: 1080,
      height: 1080,
      signedUrl: 'https://storage.example.test/signed/final.svg',
      expiresInSeconds: 300,
    );
  }

  @override
  Future<GeneratedVisualAsset?> fetchLatestVisualAsset({
    required String clinicId,
    required String contentItemId,
  }) async {
    return null;
  }

  @override
  Future<List<GeneratedCampaignPlanItem>> generateCampaignPlan({
    required PraxisState state,
    required int durationDays,
  }) {
    throw UnimplementedError();
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
  }) {
    throw UnimplementedError();
  }

  @override
  Future<ReelScriptDraft> generateReelScript({
    required String clinicId,
    required String title,
    required String specialty,
    required String tone,
    required List<String> keyPoints,
    required String ctaPreference,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<String> rewriteTone({
    required String clinicId,
    required String content,
    required String tone,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<ComplianceReviewDraft> reviewCompliance({
    required String clinicId,
    required String content,
    required String contentVersionHash,
  }) {
    throw UnimplementedError();
  }
}
