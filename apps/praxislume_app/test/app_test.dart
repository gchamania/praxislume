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
  });

  testWidgets('saves brand kit and shows deterministic preview', (
    tester,
  ) async {
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
    await tester.ensureVisible(find.text('Save brand kit'));
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
}

Future<void> _completeDemoOnboarding(
  WidgetTester tester, {
  String specialty = 'Dermatology',
  String clinicName = 'Asha Skin Clinic',
  String services = 'Acne care, Skin allergy care',
}) async {
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
  await tester.tap(find.text('Complete onboarding'));
  await tester.pumpAndSettle();
}
