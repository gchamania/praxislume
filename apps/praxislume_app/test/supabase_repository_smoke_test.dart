import 'package:flutter_test/flutter_test.dart';
import 'package:praxislume_app/main.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseKey = String.fromEnvironment('SUPABASE_ANON_KEY');
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
    'persists onboarding, brand kit, campaign, and edited content with local Supabase',
    () async {
      final client = Supabase.instance.client;
      final password = 'SmokePass123!';
      final stamp = DateTime.now().microsecondsSinceEpoch;
      final email = 'smoke-$stamp@praxislume.local';

      await client.auth.signUp(email: email, password: password);
      if (client.auth.currentSession == null) {
        await client.auth.signInWithPassword(email: email, password: password);
      }

      final controller = PraxisController(
        repository: SupabasePraxisRepository(client),
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
      await controller.generateThirtyDayCampaign();

      final firstItem = controller.state.items.first;
      await controller.updateContentItem(
        firstItem.id,
        caption:
            'Edited smoke caption for reload persistence. General education only.',
      );

      final reloaded = PraxisController(
        repository: SupabasePraxisRepository(client),
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
      expect(reloaded.state.campaign?.durationDays, 30);
      expect(reloaded.state.campaign?.title, '30-day ENT Growth Campaign');
      expect(reloaded.state.items, hasLength(30));
      final editedItem = reloaded.state.items.singleWhere(
        (item) =>
            item.caption ==
            'Edited smoke caption for reload persistence. General education only.',
      );
      expect(editedItem.status, 'drafted');
    },
    skip: _hasSupabaseConfig
        ? false
        : 'Local Supabase dart defines were not provided.',
    timeout: const Timeout(Duration(minutes: 2)),
  );
}
