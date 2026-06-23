import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';

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

    await tester.tap(find.text('Templates'));
    await tester.pumpAndSettle();
    expect(
      find.text('Preview only / deferred after MVP validation'),
      findsOneWidget,
    );

    await tester.tap(find.text('Analytics'));
    await tester.pumpAndSettle();
    expect(
      find.text('Preview only / deferred after MVP validation'),
      findsOneWidget,
    );

    await tester.tap(find.text('Media Studio'));
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
