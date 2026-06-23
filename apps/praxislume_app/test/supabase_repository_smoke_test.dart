import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
const _hasSupabaseConfig = _supabaseUrl.length > 0 && _supabaseKey.length > 0;

void main() {
  setUpAll(() async {
    if (!_hasSupabaseConfig) {
      return;
    }
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(url: _supabaseUrl, publishableKey: _supabaseKey);
  });

  tearDown(() async {
    if (!_hasSupabaseConfig) {
      return;
    }
    await Supabase.instance.client.auth.signOut();
  });

  test(
    'persists onboarding, brand kit, logo, campaign, and edited content with local Supabase',
    () async {
      final client = Supabase.instance.client;
      final password = 'SmokePass123!';
      final stamp = DateTime.now().microsecondsSinceEpoch;
      final email = 'smoke-$stamp@praxislume.local';

      await client.auth.signUp(email: email, password: password);
      if (client.auth.currentSession == null) {
        await client.auth.signInWithPassword(email: email, password: password);
      }

      final generationClient = _apiBaseUrl.isEmpty
          ? null
          : PraxisApiGenerationClient(supabase: client, baseUrl: _apiBaseUrl);
      final controller = PraxisController(
        repository: SupabasePraxisRepository(client),
        generationClient: generationClient,
      );
      await controller.load();
      expect(controller.state.isAuthenticated, isTrue);
      expect(controller.state.onboardingComplete, isFalse);

      await controller.completeOnboarding(
        doctorName: 'Dr Smoke ENT',
        qualifications: 'MBBS, MS ENT',
        specialty: 'ENT',
        clinicName: 'Smoke ENT Clinic $stamp',
        locality: 'Aundh',
        city: 'Pune',
        services: const ['Hearing care', 'Sinus care'],
        phone: '+91 98765 43210',
      );
      await controller.updateBrandKit(
        primaryColor: '#123456',
        defaultCta: 'Book an ENT consult',
      );
      final logoBytes = base64Decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      );
      await controller.uploadBrandLogo(
        bytes: logoBytes,
        fileExtension: 'png',
        contentType: 'image/png',
      );
      final logoPath = controller.state.brandKit.logoPath;
      expect(logoPath, '${controller.state.clinic!.id}/logo.png');
      final downloadedLogo = await client.storage
          .from('clinic-logos')
          .download(logoPath!);
      expect(downloadedLogo, isNotEmpty);

      await controller.generateThirtyDayCampaign();
      if (generationClient != null) {
        await _verifyBackendGenerationEndpoints(
          client: client,
          generationClient: generationClient,
          clinicId: controller.state.clinic!.id,
          specialty: controller.state.doctor!.specialty,
          tone: controller.state.brandKit.tone,
          ctaPreference: controller.state.brandKit.defaultCta,
          disclaimer: controller.state.brandKit.disclaimer,
        );
      }

      final firstItem = controller.state.items.first;
      await controller.updateContentItem(
        firstItem.id,
        caption:
            'Edited smoke caption for reload persistence. General education only.',
      );

      final reloaded = PraxisController(
        repository: SupabasePraxisRepository(client),
        generationClient: generationClient,
      );
      await reloaded.load();

      expect(reloaded.state.clinic?.name, 'Smoke ENT Clinic $stamp');
      expect(
        reloaded.state.clinic?.services,
        unorderedEquals(['Hearing care', 'Sinus care']),
      );
      expect(reloaded.state.doctor?.name, 'Dr Smoke ENT');
      expect(reloaded.state.doctor?.specialty, 'ENT');
      expect(reloaded.state.brandKit.primaryColor, '#123456');
      expect(reloaded.state.brandKit.defaultCta, 'Book an ENT consult');
      expect(reloaded.state.brandKit.logoPath, logoPath);
      expect(reloaded.state.campaign?.durationDays, 30);
      expect(reloaded.state.campaign?.title, '30-day ENT Growth Campaign');
      expect(reloaded.state.items, hasLength(30));
      final editedItem = reloaded.state.items.singleWhere(
        (item) =>
            item.caption ==
            'Edited smoke caption for reload persistence. General education only.',
      );
      expect(editedItem.status, 'drafted');

      await client.auth.signOut();
      await client.auth.signUp(
        email: 'other-$stamp@praxislume.local',
        password: password,
      );
      if (client.auth.currentSession == null) {
        await client.auth.signInWithPassword(
          email: 'other-$stamp@praxislume.local',
          password: password,
        );
      }
      Object? crossClinicDownloadError;
      try {
        await client.storage.from('clinic-logos').download(logoPath);
      } catch (error) {
        crossClinicDownloadError = error;
      }
      expect(crossClinicDownloadError, isNotNull);
    },
    skip: _hasSupabaseConfig
        ? false
        : 'Local Supabase dart defines were not provided.',
    timeout: const Timeout(Duration(minutes: 2)),
  );
}

Future<void> _verifyBackendGenerationEndpoints({
  required SupabaseClient client,
  required PraxisGenerationClient generationClient,
  required String clinicId,
  required String specialty,
  required String tone,
  required String ctaPreference,
  required String disclaimer,
}) async {
  final caption = await generationClient.generateCaption(
    clinicId: clinicId,
    title: 'Safe sinus care',
    specialty: specialty,
    tone: tone,
    keyPoints: const ['Explain symptoms safely', 'Encourage consultation'],
    ctaPreference: ctaPreference,
    disclaimerPreference: disclaimer,
  );
  expect(caption.caption, isNotEmpty);

  final reel = await generationClient.generateReelScript(
    clinicId: clinicId,
    title: 'Safe sinus care',
    specialty: specialty,
    tone: tone,
    keyPoints: const ['Explain symptoms safely', 'Encourage consultation'],
    ctaPreference: ctaPreference,
  );
  expect(reel.reelScript, isNotEmpty);

  final rewritten = await generationClient.rewriteTone(
    clinicId: clinicId,
    content: 'Explain sinus symptoms in simple language.',
    tone: tone,
  );
  expect(rewritten, isNotEmpty);

  final review = await generationClient.reviewCompliance(
    clinicId: clinicId,
    content: 'Guaranteed cure from the best clinic.',
    contentVersionHash: 'smoke-version-hash',
  );
  expect(review.status, isNotEmpty);

  final logs = await client
      .from('ai_generation_logs')
      .select('generation_type,status')
      .eq('clinic_id', clinicId);
  expect(logs, isA<List>());
  final generationTypes = {
    for (final row in logs as List)
      if (row is Map) row['generation_type'].toString(),
  };
  expect(
    generationTypes,
    containsAll([
      'campaign_plan',
      'content_item_caption',
      'reel_script',
      'tone_rewrite',
    ]),
  );

  final reviews = await client
      .from('content_compliance_reviews')
      .select('status')
      .eq('clinic_id', clinicId)
      .eq('reviewed_content_version_hash', 'smoke-version-hash');
  expect(reviews, isA<List>());
  expect(reviews as List, isNotEmpty);
}
