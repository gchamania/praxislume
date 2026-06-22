import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = SupabaseSettings.fromEnvironment();
  if (settings.isConfigured) {
    await Supabase.initialize(
      url: settings.url,
      publishableKey: settings.anonKey,
    );
  }
  runApp(const PraxisLumeApp());
}

const _clinicalTeal = Color(0xFF0D4D57);
const _softMint = Color(0xFFA7E1D6);
const _warmWhite = Color(0xFFFAFAF6);
const _graphite = Color(0xFF1C1F23);
const _gold = Color(0xFFF2C15E);

class SupabaseSettings {
  const SupabaseSettings({required this.url, required this.anonKey});

  factory SupabaseSettings.fromEnvironment() {
    return const SupabaseSettings(
      url: String.fromEnvironment('SUPABASE_URL', defaultValue: ''),
      anonKey: String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: ''),
    );
  }

  final String url;
  final String anonKey;

  bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

class ClinicProfile {
  const ClinicProfile({
    this.id = '',
    required this.name,
    required this.locality,
    required this.city,
    required this.services,
    required this.phone,
    this.whatsapp,
    this.appointmentUrl,
  });

  final String id;
  final String name;
  final String locality;
  final String city;
  final List<String> services;
  final String phone;
  final String? whatsapp;
  final String? appointmentUrl;
}

class DoctorProfile {
  const DoctorProfile({
    this.id = '',
    required this.name,
    required this.qualifications,
    required this.specialty,
  });

  final String id;
  final String name;
  final String qualifications;
  final String specialty;
}

class BrandKit {
  const BrandKit({
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.tone,
    required this.defaultCta,
    required this.disclaimer,
    this.logoPath,
  });

  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String tone;
  final String defaultCta;
  final String disclaimer;
  final String? logoPath;

  BrandKit copyWith({
    String? primaryColor,
    String? secondaryColor,
    String? accentColor,
    String? tone,
    String? defaultCta,
    String? disclaimer,
    String? logoPath,
  }) {
    return BrandKit(
      primaryColor: primaryColor ?? this.primaryColor,
      secondaryColor: secondaryColor ?? this.secondaryColor,
      accentColor: accentColor ?? this.accentColor,
      tone: tone ?? this.tone,
      defaultCta: defaultCta ?? this.defaultCta,
      disclaimer: disclaimer ?? this.disclaimer,
      logoPath: logoPath ?? this.logoPath,
    );
  }
}

class ContentCampaign {
  const ContentCampaign({
    required this.id,
    required this.title,
    required this.goal,
    required this.durationDays,
    required this.startDate,
  });

  final String id;
  final String title;
  final String goal;
  final int durationDays;
  final DateTime startDate;
}

class ContentItem {
  const ContentItem({
    required this.id,
    required this.campaignId,
    required this.dayOffset,
    required this.title,
    required this.category,
    required this.status,
    required this.caption,
    required this.shortCta,
    required this.reelScript,
  });

  final String id;
  final String campaignId;
  final int dayOffset;
  final String title;
  final String category;
  final String status;
  final String caption;
  final String shortCta;
  final String reelScript;

  ContentItem copyWith({
    String? status,
    String? caption,
    String? shortCta,
    String? reelScript,
  }) {
    return ContentItem(
      id: id,
      campaignId: campaignId,
      dayOffset: dayOffset,
      title: title,
      category: category,
      status: status ?? this.status,
      caption: caption ?? this.caption,
      shortCta: shortCta ?? this.shortCta,
      reelScript: reelScript ?? this.reelScript,
    );
  }
}

class PraxisState {
  const PraxisState({
    required this.isAuthenticated,
    required this.brandKit,
    this.clinic,
    this.doctor,
    this.campaign,
    this.items = const [],
  });

  factory PraxisState.initial() {
    return const PraxisState(
      isAuthenticated: false,
      brandKit: BrandKit(
        primaryColor: '#0D4D57',
        secondaryColor: '#A7E1D6',
        accentColor: '#F2C15E',
        tone: 'warm',
        defaultCta: 'Book a consultation',
        disclaimer:
            'This content is for general education only. Please consult a qualified doctor for personal medical advice.',
      ),
    );
  }

  final bool isAuthenticated;
  final ClinicProfile? clinic;
  final DoctorProfile? doctor;
  final BrandKit brandKit;
  final ContentCampaign? campaign;
  final List<ContentItem> items;

  bool get onboardingComplete => clinic != null && doctor != null;

  PraxisState copyWith({
    bool? isAuthenticated,
    ClinicProfile? clinic,
    DoctorProfile? doctor,
    BrandKit? brandKit,
    ContentCampaign? campaign,
    List<ContentItem>? items,
  }) {
    return PraxisState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      clinic: clinic ?? this.clinic,
      doctor: doctor ?? this.doctor,
      brandKit: brandKit ?? this.brandKit,
      campaign: campaign ?? this.campaign,
      items: items ?? this.items,
    );
  }
}

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

  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  });

  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  });
}

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
            : _newUuid(),
        name: clinicName,
        locality: locality,
        city: city,
        services: services,
        phone: phone,
      ),
      doctor: DoctorProfile(
        id: currentState.doctor?.id.isNotEmpty == true
            ? currentState.doctor!.id
            : _newUuid(),
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

class SupabasePraxisRepository implements PraxisRepository {
  SupabasePraxisRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<PraxisState> load() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return PraxisState.initial();
    }

    final clinics = _asRows(
      await _client
          .from('clinics')
          .select()
          .eq('owner_user_id', user.id)
          .order('created_at')
          .limit(1),
    );
    if (clinics.isEmpty) {
      return PraxisState.initial().copyWith(isAuthenticated: true);
    }

    final clinicRow = clinics.first;
    final clinicId = _readText(clinicRow, 'id');
    final services =
        _asRows(
              await _client
                  .from('clinic_services')
                  .select()
                  .eq('clinic_id', clinicId)
                  .order('name'),
            )
            .map((row) => _readText(row, 'name'))
            .where((name) => name.isNotEmpty)
            .toList();
    final doctorRow = await _maybeSingle(
      _client.from('doctor_profiles').select().eq('clinic_id', clinicId),
    );
    final brandRow = await _maybeSingle(
      _client.from('brand_kits').select().eq('clinic_id', clinicId),
    );
    final campaignRows = _asRows(
      await _client
          .from('content_campaigns')
          .select()
          .eq('clinic_id', clinicId)
          .order('created_at', ascending: false)
          .limit(1),
    );
    final campaign = campaignRows.isEmpty
        ? null
        : _campaignFromRow(campaignRows.first);
    final items = campaign == null
        ? <ContentItem>[]
        : _asRows(
            await _client
                .from('content_items')
                .select()
                .eq('campaign_id', campaign.id)
                .order('day_offset'),
          ).map(_contentItemFromRow).toList();

    return PraxisState(
      isAuthenticated: true,
      clinic: ClinicProfile(
        id: clinicId,
        name: _readText(clinicRow, 'name'),
        locality: _readText(clinicRow, 'locality'),
        city: _readText(clinicRow, 'city'),
        services: services,
        phone: _readText(clinicRow, 'phone'),
        whatsapp: _nullableText(clinicRow, 'whatsapp'),
        appointmentUrl: _nullableText(clinicRow, 'appointment_url'),
      ),
      doctor: doctorRow == null
          ? null
          : DoctorProfile(
              id: _readText(doctorRow, 'id'),
              name: _readText(doctorRow, 'doctor_name'),
              qualifications: _readText(doctorRow, 'qualifications'),
              specialty: 'Dermatology',
            ),
      brandKit: brandRow == null
          ? PraxisState.initial().brandKit
          : _brandKitFromRow(brandRow),
      campaign: campaign,
      items: items,
    );
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
    final userId = _requiredUserId();
    final clinicPayload = {
      if (currentState.clinic?.id.isNotEmpty == true)
        'id': currentState.clinic!.id,
      'owner_user_id': userId,
      'name': clinicName,
      'locality': locality,
      'city': city,
      'phone': phone,
      'whatsapp': phone,
    };
    final clinicRow = Map<String, dynamic>.from(
      await _client.from('clinics').upsert(clinicPayload).select().single()
          as Map,
    );
    final clinicId = _readText(clinicRow, 'id');

    final doctorRow = Map<String, dynamic>.from(
      await _client
              .from('doctor_profiles')
              .upsert({
                if (currentState.doctor?.id.isNotEmpty == true)
                  'id': currentState.doctor!.id,
                'clinic_id': clinicId,
                'user_id': userId,
                'doctor_name': doctorName,
                'qualifications': qualifications,
              }, onConflict: 'clinic_id,user_id')
              .select()
              .single()
          as Map,
    );

    await _client.from('clinic_services').delete().eq('clinic_id', clinicId);
    if (services.isNotEmpty) {
      await _client.from('clinic_services').insert([
        for (final service in services)
          {'clinic_id': clinicId, 'name': service},
      ]);
    }

    final nextState = currentState.copyWith(
      isAuthenticated: true,
      clinic: ClinicProfile(
        id: clinicId,
        name: clinicName,
        locality: locality,
        city: city,
        services: services,
        phone: phone,
        whatsapp: phone,
      ),
      doctor: DoctorProfile(
        id: _readText(doctorRow, 'id'),
        name: doctorName,
        qualifications: qualifications,
        specialty: specialty,
      ),
    );
    return saveBrandKit(currentState: nextState, brandKit: nextState.brandKit);
  }

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) async {
    final clinic = currentState.clinic;
    if (clinic == null || clinic.id.isEmpty) {
      return currentState.copyWith(brandKit: brandKit);
    }
    final doctor = currentState.doctor;
    final row = await _client
        .from('brand_kits')
        .upsert({
          'clinic_id': clinic.id,
          'clinic_display_name': clinic.name,
          'doctor_display_name': doctor?.name ?? clinic.name,
          'qualifications': doctor?.qualifications ?? '',
          'locations': [
            {'locality': clinic.locality, 'city': clinic.city},
          ],
          'phone': clinic.phone,
          'whatsapp': clinic.whatsapp ?? clinic.phone,
          'appointment_url': clinic.appointmentUrl,
          'primary_color': brandKit.primaryColor,
          'secondary_color': brandKit.secondaryColor,
          'accent_color': brandKit.accentColor,
          'typography_style': 'clean',
          'tone': brandKit.tone,
          'default_cta': brandKit.defaultCta,
          'disclaimer_text': brandKit.disclaimer,
          'logo_path': brandKit.logoPath,
        }, onConflict: 'clinic_id')
        .select()
        .single();
    return currentState.copyWith(
      brandKit: _brandKitFromRow(Map<String, dynamic>.from(row as Map)),
    );
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) async {
    final clinic = currentState.clinic;
    if (clinic == null || clinic.id.isEmpty) {
      return currentState.copyWith(campaign: campaign, items: items);
    }

    final campaignRow = await _client
        .from('content_campaigns')
        .upsert({
          'id': campaign.id,
          'clinic_id': clinic.id,
          'title': campaign.title,
          'goal': campaign.goal,
          'duration_days': campaign.durationDays,
          'start_date': _dateOnly(campaign.startDate),
          'status': 'draft',
        })
        .select()
        .single();
    final savedCampaign = _campaignFromRow(
      Map<String, dynamic>.from(campaignRow as Map),
    );

    await _client
        .from('content_items')
        .delete()
        .eq('campaign_id', savedCampaign.id);
    if (items.isNotEmpty) {
      await _client.from('content_items').insert([
        for (final item in items)
          {
            'id': item.id,
            'clinic_id': clinic.id,
            'campaign_id': savedCampaign.id,
            'scheduled_date': _dateOnly(
              savedCampaign.startDate.add(Duration(days: item.dayOffset)),
            ),
            'day_offset': item.dayOffset,
            'title': item.title,
            'category': item.category,
            'status': item.status,
            'caption': item.caption,
            'short_cta': item.shortCta,
            'reel_script': item.reelScript,
            'disclaimer_text': currentState.brandKit.disclaimer,
          },
      ]);
    }

    return currentState.copyWith(campaign: savedCampaign, items: items);
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  }) async {
    await _client
        .from('content_items')
        .update({
          'caption': caption,
          'status': 'drafted',
          'user_edited_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', id);
    return currentState.copyWith(
      items: [
        for (final item in currentState.items)
          if (item.id == id)
            item.copyWith(caption: caption, status: 'drafted')
          else
            item,
      ],
    );
  }

  String _requiredUserId() {
    final user = _client.auth.currentUser;
    if (user == null) {
      throw StateError('Supabase user session is required for persistence.');
    }
    return user.id;
  }
}

class SessionAwarePraxisRepository implements PraxisRepository {
  SessionAwarePraxisRepository(this._client)
    : _fallback = InMemoryPraxisRepository();

  final SupabaseClient _client;
  final InMemoryPraxisRepository _fallback;

  PraxisRepository get _activeRepository => _client.auth.currentUser == null
      ? _fallback
      : SupabasePraxisRepository(_client);

  @override
  Future<PraxisState> load() => _activeRepository.load();

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
  }) {
    return _activeRepository.saveOnboarding(
      currentState: currentState,
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

  @override
  Future<PraxisState> saveBrandKit({
    required PraxisState currentState,
    required BrandKit brandKit,
  }) {
    return _activeRepository.saveBrandKit(
      currentState: currentState,
      brandKit: brandKit,
    );
  }

  @override
  Future<PraxisState> saveCampaignPackage({
    required PraxisState currentState,
    required ContentCampaign campaign,
    required List<ContentItem> items,
  }) {
    return _activeRepository.saveCampaignPackage(
      currentState: currentState,
      campaign: campaign,
      items: items,
    );
  }

  @override
  Future<PraxisState> updateContentItem({
    required PraxisState currentState,
    required String id,
    required String caption,
  }) {
    return _activeRepository.updateContentItem(
      currentState: currentState,
      id: id,
      caption: caption,
    );
  }
}

List<Map<String, dynamic>> _asRows(Object? value) {
  if (value is! List) {
    return const [];
  }
  return [
    for (final row in value)
      if (row is Map) Map<String, dynamic>.from(row),
  ];
}

Future<Map<String, dynamic>?> _maybeSingle(dynamic query) async {
  final value = await query.maybeSingle();
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

String _readText(Map<String, dynamic> row, String key) {
  final value = row[key];
  return value == null ? '' : value.toString();
}

String? _nullableText(Map<String, dynamic> row, String key) {
  final value = _readText(row, key);
  return value.isEmpty ? null : value;
}

BrandKit _brandKitFromRow(Map<String, dynamic> row) {
  return BrandKit(
    primaryColor: _readText(row, 'primary_color').isEmpty
        ? '#0D4D57'
        : _readText(row, 'primary_color'),
    secondaryColor: _readText(row, 'secondary_color').isEmpty
        ? '#A7E1D6'
        : _readText(row, 'secondary_color'),
    accentColor: _readText(row, 'accent_color').isEmpty
        ? '#F2C15E'
        : _readText(row, 'accent_color'),
    tone: _readText(row, 'tone').isEmpty ? 'warm' : _readText(row, 'tone'),
    defaultCta: _readText(row, 'default_cta').isEmpty
        ? 'Book a consultation'
        : _readText(row, 'default_cta'),
    disclaimer: _readText(row, 'disclaimer_text').isEmpty
        ? PraxisState.initial().brandKit.disclaimer
        : _readText(row, 'disclaimer_text'),
    logoPath: _nullableText(row, 'logo_path'),
  );
}

ContentCampaign _campaignFromRow(Map<String, dynamic> row) {
  return ContentCampaign(
    id: _readText(row, 'id'),
    title: _readText(row, 'title'),
    goal: _readText(row, 'goal'),
    durationDays: int.tryParse(_readText(row, 'duration_days')) ?? 30,
    startDate:
        DateTime.tryParse(_readText(row, 'start_date')) ?? DateTime.now(),
  );
}

ContentItem _contentItemFromRow(Map<String, dynamic> row) {
  return ContentItem(
    id: _readText(row, 'id'),
    campaignId: _readText(row, 'campaign_id'),
    dayOffset: int.tryParse(_readText(row, 'day_offset')) ?? 0,
    title: _readText(row, 'title'),
    category: _readText(row, 'category'),
    status: _readText(row, 'status'),
    caption: _readText(row, 'caption'),
    shortCta: _readText(row, 'short_cta'),
    reelScript: _readText(row, 'reel_script'),
  );
}

String _dateOnly(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

String _newUuid() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  final hex = bytes
      .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
      .join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
}

class PraxisController extends StateNotifier<PraxisState> {
  PraxisController({PraxisRepository? repository})
    : _repository = repository ?? InMemoryPraxisRepository(),
      super(PraxisState.initial());

  final PraxisRepository _repository;

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
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null) {
      return;
    }

    const categories = [
      'awareness',
      'myth_buster',
      'symptoms',
      'procedure_explainer',
      'seasonal_health_tip',
      'clinic_service',
      'faq',
    ];
    const categoryLabels = {
      'awareness': 'Awareness',
      'myth_buster': 'Myth-buster',
      'symptoms': 'Symptoms',
      'procedure_explainer': 'Procedure explainer',
      'seasonal_health_tip': 'Seasonal health tip',
      'clinic_service': 'Clinic service',
      'faq': 'FAQ',
    };
    final campaign = ContentCampaign(
      id: _newUuid(),
      title: '30-day ${doctor.specialty} Growth Campaign',
      goal: 'increase appointment enquiries',
      durationDays: 30,
      startDate: DateTime.now(),
    );
    final items = List.generate(30, (index) {
      final category = categories[index % categories.length];
      final service = clinic.services[index % clinic.services.length];
      final label = categoryLabels[category]!;
      return ContentItem(
        id: _newUuid(),
        campaignId: campaign.id,
        dayOffset: index,
        title: 'Day ${index + 1}: $label for $service',
        category: category,
        status: 'drafted',
        caption:
            'A patient-friendly $label post about $service for ${clinic.locality}. This is general education and should be reviewed by ${doctor.name}.',
        shortCta: state.brandKit.defaultCta,
        reelScript:
            'Open with a common concern, explain one safe care tip, and close with ${state.brandKit.defaultCta}.',
      );
    });

    state = await _repository.saveCampaignPackage(
      currentState: state,
      campaign: campaign,
      items: items,
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
    required String primaryColor,
    required String defaultCta,
  }) async {
    state = await _repository.saveBrandKit(
      currentState: state,
      brandKit: state.brandKit.copyWith(
        primaryColor: primaryColor,
        defaultCta: defaultCta,
      ),
    );
  }
}

final praxisRepositoryProvider = Provider<PraxisRepository>((ref) {
  final settings = SupabaseSettings.fromEnvironment();
  if (settings.isConfigured) {
    try {
      return SessionAwarePraxisRepository(Supabase.instance.client);
    } on StateError {
      return InMemoryPraxisRepository();
    }
  }
  return InMemoryPraxisRepository();
});

final praxisProvider = StateNotifierProvider<PraxisController, PraxisState>((
  ref,
) {
  return PraxisController(repository: ref.watch(praxisRepositoryProvider));
});

class PraxisLumeApp extends StatelessWidget {
  const PraxisLumeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const ProviderScope(child: _PraxisRouterApp());
  }
}

class _PraxisRouterApp extends StatefulWidget {
  const _PraxisRouterApp();

  @override
  State<_PraxisRouterApp> createState() => _PraxisRouterAppState();
}

class _PraxisRouterAppState extends State<_PraxisRouterApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/sign-in',
      routes: [
        GoRoute(
          path: '/sign-in',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/calendar',
          builder: (context, state) => const CalendarScreen(),
        ),
        GoRoute(
          path: '/brand',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/content/:id',
          builder: (context, state) =>
              ContentDetailScreen(itemId: state.pathParameters['id']!),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'PraxisLume',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: _clinicalTeal,
          primary: _clinicalTeal,
          secondary: _softMint,
          surface: _warmWhite,
        ),
        scaffoldBackgroundColor: _warmWhite,
        useMaterial3: true,
        cardTheme: const CardThemeData(
          margin: EdgeInsets.symmetric(vertical: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
            side: BorderSide(color: Color(0x1F1C1F23)),
          ),
        ),
      ),
      routerConfig: _router,
    );
  }
}

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'PraxisLume',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: _clinicalTeal,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Sign in to continue'),
                const SizedBox(height: 24),
                TextField(
                  key: const Key('emailField'),
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  key: const Key('passwordField'),
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => _authenticate(createAccount: false),
                  child: const Text('Sign in'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => _authenticate(createAccount: true),
                  child: const Text('Create account'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () async {
                    await ref.read(praxisProvider.notifier).signInDemo();
                    if (!context.mounted) {
                      return;
                    }
                    final state = ref.read(praxisProvider);
                    context.go(
                      state.onboardingComplete ? '/dashboard' : '/onboarding',
                    );
                  },
                  child: const Text('Use demo account'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _authenticate({required bool createAccount}) async {
    final settings = SupabaseSettings.fromEnvironment();
    if (!settings.isConfigured) {
      _showMessage('Supabase is not configured for this build');
      return;
    }

    try {
      final auth = Supabase.instance.client.auth;
      if (createAccount) {
        await auth.signUp(email: _email.text.trim(), password: _password.text);
      } else {
        await auth.signInWithPassword(
          email: _email.text.trim(),
          password: _password.text,
        );
      }
      await ref.read(praxisProvider.notifier).load();
      if (!mounted) {
        return;
      }
      final state = ref.read(praxisProvider);
      context.go(state.onboardingComplete ? '/dashboard' : '/onboarding');
    } on AuthException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Sign in failed');
    }
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _doctorName = TextEditingController();
  final _qualifications = TextEditingController();
  final _specialty = TextEditingController();
  final _clinicName = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController();
  final _services = TextEditingController();
  final _phone = TextEditingController();

  @override
  void dispose() {
    _doctorName.dispose();
    _qualifications.dispose();
    _specialty.dispose();
    _clinicName.dispose();
    _locality.dispose();
    _city.dispose();
    _services.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clinic onboarding')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _submit,
            child: const Text('Complete onboarding'),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Doctor and clinic profile',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          Form(
            key: _formKey,
            child: Column(
              children: [
                _field(
                  _doctorName,
                  'Doctor name',
                  const Key('doctorNameField'),
                  requiredMessage: 'Doctor name is required',
                ),
                _field(
                  _qualifications,
                  'Qualifications',
                  const Key('qualificationsField'),
                ),
                _field(
                  _specialty,
                  'Specialty',
                  const Key('specialtyField'),
                ),
                _field(
                  _clinicName,
                  'Clinic name',
                  const Key('clinicNameField'),
                ),
                _field(_locality, 'Locality', const Key('localityField')),
                _field(_city, 'City', const Key('cityField')),
                _field(
                  _services,
                  'Clinic services',
                  const Key('servicesField'),
                ),
                _field(_phone, 'Phone or WhatsApp', const Key('phoneField')),
                const SizedBox(height: 72),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    await ref
        .read(praxisProvider.notifier)
        .completeOnboarding(
          doctorName: _doctorName.text.trim(),
          qualifications: _qualifications.text.trim(),
          specialty: _specialty.text.trim(),
          clinicName: _clinicName.text.trim(),
          locality: _locality.text.trim(),
          city: _city.text.trim(),
          services: _services.text
              .split(',')
              .map((service) => service.trim())
              .where((service) => service.isNotEmpty)
              .toList(),
          phone: _phone.text.trim(),
        );
    if (!mounted) {
      return;
    }
    context.go('/dashboard');
  }

  Widget _field(
    TextEditingController controller,
    String label,
    Key key, {
    String? requiredMessage,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        key: key,
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        validator: (value) {
          if ((value ?? '').trim().isEmpty) {
            return requiredMessage ?? '$label is required';
          }
          return null;
        },
      ),
    );
  }
}

class _AppScaffold extends StatelessWidget {
  const _AppScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          TextButton(
            onPressed: () => context.go('/dashboard'),
            child: const Text('Home'),
          ),
          TextButton(
            onPressed: () => context.go('/calendar'),
            child: const Text('Calendar'),
          ),
          TextButton(
            onPressed: () => context.go('/brand'),
            child: const Text('Brand'),
          ),
          TextButton(
            onPressed: () => context.go('/settings'),
            child: const Text('Settings'),
          ),
        ],
      ),
      body: ListView(padding: const EdgeInsets.all(24), children: [child]),
    );
  }
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'PraxisLume',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dashboard', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(state.clinic?.name ?? 'No clinic'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Campaign readiness'),
                  Text('Content ideas: ${state.items.length}'),
                  Text('Brand tone: ${state.brandKit.tone}'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'Content calendar',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Content calendar',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async =>
                ref.read(praxisProvider.notifier).generateThirtyDayCampaign(),
            child: const Text('Generate 30-day campaign'),
          ),
          if (state.campaign != null) ...[
            const SizedBox(height: 16),
            Text(
              state.campaign!.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text('Content ideas: ${state.items.length}'),
            const SizedBox(height: 8),
            for (final item in state.items.take(9))
              Card(
                child: ListTile(
                  title: Text(item.title),
                  subtitle: Text('${item.category} - ${item.status}'),
                  onTap: () => context.go('/content/${item.id}'),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class ContentDetailScreen extends ConsumerStatefulWidget {
  const ContentDetailScreen({required this.itemId, super.key});

  final String itemId;

  @override
  ConsumerState<ContentDetailScreen> createState() =>
      _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  late final TextEditingController _caption;
  bool _postPackageCopied = false;

  @override
  void initState() {
    super.initState();
    final item = ref
        .read(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    _caption = TextEditingController(text: item.caption);
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = ref
        .watch(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    return _AppScaffold(
      title: item.title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          TextField(
            key: const Key('captionField'),
            controller: _caption,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Caption',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              FilledButton(
                onPressed: () async {
                  await ref
                      .read(praxisProvider.notifier)
                      .updateContentItem(item.id, caption: _caption.text);
                  if (!context.mounted) {
                    return;
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Content item saved')),
                  );
                },
                child: const Text('Save item'),
              ),
              OutlinedButton(
                onPressed: () {
                  final updated = ref
                      .read(praxisProvider)
                      .items
                      .firstWhere((candidate) => candidate.id == widget.itemId);
                  final package =
                      'Title: ${updated.title}\nCaption: ${updated.caption}\nCTA: ${updated.shortCta}\nReel script: ${updated.reelScript}';
                  Clipboard.setData(ClipboardData(text: package));
                  setState(() => _postPackageCopied = true);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Post package copied')),
                  );
                },
                child: const Text('Copy post package'),
              ),
            ],
          ),
          if (_postPackageCopied) ...[
            const SizedBox(height: 12),
            const Text('Post package copied'),
          ],
        ],
      ),
    );
  }
}

class BrandKitScreen extends ConsumerStatefulWidget {
  const BrandKitScreen({super.key});

  @override
  ConsumerState<BrandKitScreen> createState() => _BrandKitScreenState();
}

class _BrandKitScreenState extends ConsumerState<BrandKitScreen> {
  late final TextEditingController _primaryColor;
  late final TextEditingController _cta;

  @override
  void initState() {
    super.initState();
    final brand = ref.read(praxisProvider).brandKit;
    _primaryColor = TextEditingController(text: brand.primaryColor);
    _cta = TextEditingController(text: brand.defaultCta);
  }

  @override
  void dispose() {
    _primaryColor.dispose();
    _cta.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'Brand kit',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Brand kit', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 16),
          TextField(
            key: const Key('primaryColorField'),
            controller: _primaryColor,
            decoration: const InputDecoration(
              labelText: 'Primary color',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('ctaField'),
            controller: _cta,
            decoration: const InputDecoration(
              labelText: 'Default CTA',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              await ref
                  .read(praxisProvider.notifier)
                  .updateBrandKit(
                    primaryColor: _primaryColor.text.trim(),
                    defaultCta: _cta.text.trim(),
                  );
              if (!context.mounted) {
                return;
              }
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(const SnackBar(content: Text('Brand kit saved')));
            },
            child: const Text('Save brand kit'),
          ),
          const SizedBox(height: 16),
          BrandPreview(state: state),
        ],
      ),
    );
  }
}

class BrandPreview extends StatelessWidget {
  const BrandPreview({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: _softMint.withValues(alpha: 0.28),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              state.clinic?.name ?? 'Clinic name',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(color: _clinicalTeal),
            ),
            const SizedBox(height: 8),
            Text(state.doctor?.name ?? 'Doctor name'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _gold,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                state.brandKit.defaultCta,
                style: const TextStyle(
                  color: _graphite,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              state.brandKit.disclaimer,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AppScaffold(
      title: 'Settings',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Settings', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {
              ref.read(praxisProvider.notifier).signOut();
              context.go('/sign-in');
            },
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}
