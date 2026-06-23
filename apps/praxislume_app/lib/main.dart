import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'ui/praxis_components.dart';
import 'ui/praxis_theme.dart';

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
      _client
          .from('doctor_profiles')
          .select('*, specialties(name)')
          .eq('clinic_id', clinicId),
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
              specialty: _doctorSpecialtyFromRow(doctorRow),
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

    final specialtyId = await _specialtyIdFor(specialty);
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
                'specialty_id': specialtyId,
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

  Future<String?> _specialtyIdFor(String specialty) async {
    final specialtyName = specialty.trim();
    if (specialtyName.isEmpty) {
      return null;
    }
    final rows = _asRows(
      await _client
          .from('specialties')
          .select('id')
          .ilike('name', specialtyName)
          .limit(1),
    );
    if (rows.isEmpty) {
      return null;
    }
    return _nullableText(rows.first, 'id');
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

String _doctorSpecialtyFromRow(Map<String, dynamic> row) {
  final specialty = row['specialties'];
  if (specialty is Map) {
    final name = _readText(Map<String, dynamic>.from(specialty), 'name');
    if (name.isNotEmpty) {
      return name;
    }
  }
  return 'Dermatology';
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
      initialLocation: '/signin',
      routes: [
        GoRoute(
          path: '/signin',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/sign-in',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignUpScreen(),
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
          path: '/generate',
          builder: (context, state) => const GenerateContentScreen(),
        ),
        GoRoute(
          path: '/calendar',
          builder: (context, state) => const CalendarScreen(),
        ),
        GoRoute(
          path: '/library',
          builder: (context, state) => const ContentLibraryScreen(),
        ),
        GoRoute(
          path: '/brand',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/brand-settings',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/templates',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/templates',
            title: 'Templates',
            message: 'Templates are planned after MVP validation.',
            icon: Icons.dynamic_feed_outlined,
          ),
        ),
        GoRoute(
          path: '/analytics',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/analytics',
            title: 'Analytics',
            message: 'Analytics arrive after pilot usage data exists.',
            icon: Icons.bar_chart_outlined,
          ),
        ),
        GoRoute(
          path: '/media-studio',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/media-studio',
            title: 'Media Studio',
            message: 'Media Studio is outside the MVP.',
            icon: Icons.video_library_outlined,
          ),
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
      debugShowCheckedModeBanner: false,
      theme: buildPraxisTheme(),
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
    return AuthSplitScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 26),
          const Text(
            'Your Doctor Growth OS.',
            style: TextStyle(
              color: praxisTealDark,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 16),
          Text('Welcome back', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 8),
          const Text('Sign in to continue'),
          const SizedBox(height: 20),
          TextField(
            key: const Key('emailField'),
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.mail_outline),
              hintText: 'Enter your email',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('passwordField'),
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Password',
              prefixIcon: Icon(Icons.lock_outline),
              suffixIcon: Icon(Icons.visibility_off_outlined),
              hintText: 'Enter your password',
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              child: const Text('Forgot password?'),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () => _authenticate(createAccount: false),
            child: const Text('Sign in'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => context.go('/signup'),
            child: const Text('Create account'),
          ),
          const SizedBox(height: 6),
          TextButton(
            onPressed: _signInDemo,
            child: const Text('Use demo account'),
          ),
          const SizedBox(height: 16),
          const SecurityNotice(),
        ],
      ),
    );
  }

  Future<void> _signInDemo() async {
    await ref.read(praxisProvider.notifier).signInDemo();
    if (!mounted) {
      return;
    }
    final state = ref.read(praxisProvider);
    context.go(state.onboardingComplete ? '/dashboard' : '/onboarding');
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

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _clinic = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    _clinic.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthSplitScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 34),
          Text(
            'Create your account',
            style: Theme.of(context).textTheme.displaySmall,
          ),
          const SizedBox(height: 8),
          const Text('Start with the essentials for your clinic workspace.'),
          const SizedBox(height: 24),
          _authField(_name, 'Full Name', Icons.person_outline),
          _authField(_email, 'Email Address', Icons.mail_outline),
          _authField(_phone, 'Phone Number', Icons.phone_outlined),
          _authField(_password, 'Password', Icons.lock_outline, obscure: true),
          _authField(
            _confirm,
            'Confirm Password',
            Icons.lock_outline,
            obscure: true,
          ),
          _authField(
            _clinic,
            'Clinic / Practice Name',
            Icons.local_hospital_outlined,
          ),
          const SizedBox(height: 8),
          const PraxisChip(
            label: 'Doctor workspace',
            icon: Icons.medical_services_outlined,
            color: praxisMint,
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: () => _authenticate(createAccount: true),
            child: const Text('Create PraxisLume Account'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/signin'),
            child: const Text('Already have an account? Sign in'),
          ),
        ],
      ),
    );
  }

  Widget _authField(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool obscure = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      ),
    );
  }

  Future<void> _authenticate({required bool createAccount}) async {
    final settings = SupabaseSettings.fromEnvironment();
    if (!settings.isConfigured) {
      _showMessage('Supabase is not configured for this build');
      return;
    }
    if (_password.text != _confirm.text) {
      _showMessage('Passwords do not match');
      return;
    }
    try {
      await Supabase.instance.client.auth.signUp(
        email: _email.text.trim(),
        password: _password.text,
      );
      await ref.read(praxisProvider.notifier).load();
      if (!mounted) {
        return;
      }
      context.go('/onboarding');
    } on AuthException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Account creation failed');
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

class AuthSplitScaffold extends StatelessWidget {
  const AuthSplitScaffold({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1220),
                child: Container(
                  height: max(0, constraints.maxHeight - 40),
                  margin: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: praxisSurface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: praxisLine),
                    boxShadow: [
                      BoxShadow(
                        color: praxisInk.withValues(alpha: 0.08),
                        blurRadius: 30,
                        offset: const Offset(0, 18),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: wide
                      ? Row(
                          children: [
                            Expanded(
                              child: SingleChildScrollView(
                                padding: const EdgeInsets.all(64),
                                child: child,
                              ),
                            ),
                            const Expanded(child: AuthHeroPanel()),
                          ],
                        )
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(28),
                          child: child,
                        ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class AuthHeroPanel extends StatelessWidget {
  const AuthHeroPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(56),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF06363C), Color(0xFF005A60)],
        ),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Doctor Growth OS.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 34,
                height: 1.15,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              '30 days of branded medical content in 30 minutes.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                height: 1.35,
                fontWeight: FontWeight.w700,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 44),
            PraxisCard(
              color: Colors.white.withValues(alpha: 0.95),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      PraxisLogo(compact: true),
                      SizedBox(width: 10),
                      Text(
                        'Content Calendar',
                        style: TextStyle(
                          color: praxisInk,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: List.generate(
                      5,
                      (index) => Expanded(
                        child: Container(
                          height: 58,
                          margin: EdgeInsets.only(right: index == 4 ? 0 : 8),
                          decoration: BoxDecoration(
                            color: [
                              praxisPurple,
                              praxisMint,
                              praxisTeal,
                              praxisLine,
                              praxisGold,
                            ][index].withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 120,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(
                        8,
                        (index) => Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 34 + (index * 9 % 74).toDouble(),
                            decoration: BoxDecoration(
                              color: index.isEven
                                  ? praxisPurple.withValues(alpha: 0.32)
                                  : praxisTeal.withValues(alpha: 0.28),
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),
            const _HeroBenefit(
              icon: Icons.schedule,
              title: 'Save 10+ hours every week',
              text: 'AI-assisted content planning tailored for your clinic.',
            ),
            const _HeroBenefit(
              icon: Icons.verified_user_outlined,
              title: 'Build trust and authority',
              text: 'Consistent, accurate and professional content.',
            ),
            const _HeroBenefit(
              icon: Icons.trending_up,
              title: 'Grow your patient base',
              text: 'Educational content that supports patient acquisition.',
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroBenefit extends StatelessWidget {
  const _HeroBenefit({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: praxisTeal.withValues(alpha: 0.8),
            foregroundColor: Colors.white,
            child: Icon(icon),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SecurityNotice extends StatelessWidget {
  const SecurityNotice({super.key});

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      color: praxisMint,
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: praxisTealDark),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              'Your data is safe with us. Never enter patient-identifiable data into generation prompts.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: praxisText,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
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
    final compact = MediaQuery.sizeOf(context).width < 980;
    final form = Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisChip(label: 'Step 1 of 7', color: praxisMint),
          const SizedBox(height: 24),
          Text(
            'Doctor and clinic profile',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'This single MVP step captures the details needed to generate specialty-aware campaigns.',
          ),
          const SizedBox(height: 24),
          PraxisCard(
            child: Column(
              children: [
                _field(
                  _doctorName,
                  'Doctor name',
                  const Key('doctorNameField'),
                  icon: Icons.person_outline,
                  requiredMessage: 'Doctor name is required',
                ),
                _field(
                  _qualifications,
                  'Qualifications',
                  const Key('qualificationsField'),
                  icon: Icons.workspace_premium_outlined,
                ),
                _field(
                  _specialty,
                  'Specialty',
                  const Key('specialtyField'),
                  icon: Icons.medical_services_outlined,
                ),
                _field(
                  _clinicName,
                  'Clinic name',
                  const Key('clinicNameField'),
                  icon: Icons.local_hospital_outlined,
                ),
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        _locality,
                        'Locality',
                        const Key('localityField'),
                        icon: Icons.place_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        _city,
                        'City',
                        const Key('cityField'),
                        icon: Icons.location_city_outlined,
                      ),
                    ),
                  ],
                ),
                _field(
                  _services,
                  'Clinic services',
                  const Key('servicesField'),
                  icon: Icons.medical_services_outlined,
                  helper:
                      'Separate services with commas, e.g. sinus consultation, ear infection care.',
                ),
                _field(
                  _phone,
                  'Phone or WhatsApp',
                  const Key('phoneField'),
                  icon: Icons.phone_outlined,
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return Scaffold(
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: EdgeInsets.fromLTRB(
            compact ? 16 : 28,
            14,
            compact ? 16 : 28,
            14,
          ),
          decoration: const BoxDecoration(
            color: praxisSurface,
            border: Border(top: BorderSide(color: praxisLine)),
          ),
          child: compact
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    FilledButton.icon(
                      onPressed: _submit,
                      iconAlignment: IconAlignment.end,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('Complete onboarding'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Back'),
                    ),
                  ],
                )
              : Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Back'),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {},
                      child: const Text('Skip for now'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: _submit,
                      iconAlignment: IconAlignment.end,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('Complete onboarding'),
                    ),
                  ],
                ),
        ),
      ),
      body: SafeArea(
        child: Row(
          children: [
            if (!compact) const OnboardingRail(),
            Expanded(
              child: ListView(
                padding: EdgeInsets.fromLTRB(
                  compact ? 20 : 34,
                  compact ? 20 : 34,
                  compact ? 20 : 34,
                  110,
                ),
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.close),
                      label: const Text('Exit Onboarding'),
                    ),
                  ),
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1120),
                      child: compact
                          ? form
                          : Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(flex: 2, child: form),
                                const SizedBox(width: 28),
                                const Expanded(child: OnboardingPreview()),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
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
    required IconData icon,
    String? requiredMessage,
    String? helper,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        key: key,
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          prefixIcon: Icon(icon),
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

class OnboardingRail extends StatelessWidget {
  const OnboardingRail({super.key});

  @override
  Widget build(BuildContext context) {
    const steps = [
      ('Choose Specialty', Icons.medical_services_outlined),
      ('Clinic Details', Icons.local_hospital_outlined),
      ('Doctor Profile', Icons.person_outline),
      ('Brand Identity', Icons.palette_outlined),
      ('Content Goals', Icons.track_changes_outlined),
      ('Preferred Platforms', Icons.devices_outlined),
      ("You're All Set!", Icons.check_circle_outline),
    ];
    return Container(
      width: 270,
      padding: const EdgeInsets.fromLTRB(28, 30, 20, 24),
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(right: BorderSide(color: praxisLine)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 70),
          Text(
            'Welcome to PraxisLume',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text('Set up your practice in a few focused steps.'),
          const SizedBox(height: 28),
          for (var i = 0; i < steps.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: i == 0 ? praxisTeal : praxisSurface,
                    foregroundColor: i == 0 ? Colors.white : praxisText,
                    child: i == 0
                        ? const Text(
                            '1',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          )
                        : Text('${i + 1}'),
                  ),
                  const SizedBox(width: 12),
                  Icon(steps[i].$2, color: i == 0 ? praxisTeal : praxisMuted),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      steps[i].$1,
                      style: TextStyle(
                        color: i == 0 ? praxisTealDark : praxisText,
                        fontWeight: i == 0 ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const Spacer(),
          const SecurityNotice(),
        ],
      ),
    );
  }
}

class OnboardingPreview extends StatelessWidget {
  const OnboardingPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PraxisCard(
          color: praxisMint.withValues(alpha: 0.7),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.assignment_turned_in_outlined, size: 72),
              const SizedBox(height: 24),
              Text(
                'Why this matters',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 18),
              const _PreviewReason(
                icon: Icons.track_changes,
                text: 'Relevant ideas based on specialty and services.',
              ),
              const _PreviewReason(
                icon: Icons.groups_2_outlined,
                text: 'Patient-friendly education without diagnosis claims.',
              ),
              const _PreviewReason(
                icon: Icons.trending_up,
                text: 'A consistent foundation for campaign growth.',
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        PraxisCard(
          child: Text(
            'The content ideas are so relevant to my practice. It saves me hours every week.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
      ],
    );
  }
}

class _PreviewReason extends StatelessWidget {
  const _PreviewReason({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: praxisSurface,
            foregroundColor: praxisTealDark,
            child: Icon(icon),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    final doctorName = state.doctor?.name ?? 'Doctor';
    return WorkspaceShell(
      title: 'Good morning, $doctorName',
      subtitle: "Here's your content and growth overview.",
      currentRoute: '/dashboard',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Create New Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Practice snapshot',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (state.clinic != null) ...[
            const SizedBox(height: 6),
            Text(
              state.clinic!.name,
              style: const TextStyle(
                color: praxisTealDark,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) => Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.video_camera_back_outlined,
                    value: '${state.items.length}',
                    label: 'Content ideas',
                    delta: 'Ready for review',
                    tint: praxisPurple,
                  ),
                ),
                _statBox(
                  constraints,
                  const StatCard(
                    icon: Icons.visibility_outlined,
                    value: '45.8K',
                    label: 'Mockup reach target',
                    delta: 'Reference only',
                    tint: praxisTeal,
                  ),
                ),
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.health_and_safety_outlined,
                    value: state.doctor?.specialty ?? 'Specialty',
                    label: 'Specialty focus',
                    tint: praxisGold,
                  ),
                ),
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.calendar_month_outlined,
                    value: '${state.campaign?.durationDays ?? 30}',
                    label: 'Campaign days',
                    tint: const Color(0xFF2E79FF),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _DashboardGrid(state: state),
        ],
      ),
    );
  }
}

Widget _statBox(BoxConstraints constraints, Widget child) {
  final width = constraints.maxWidth;
  final columns = width >= 1120
      ? 4
      : width >= 760
      ? 2
      : 1;
  return SizedBox(
    width: (width - ((columns - 1) * 16)) / columns,
    child: child,
  );
}

class _DashboardGrid extends StatelessWidget {
  const _DashboardGrid({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final items = state.items.take(4).toList();
    return LayoutBuilder(
      builder: (context, constraints) {
        final twoColumns = constraints.maxWidth > 960;
        final left = Column(
          children: [
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        "Today's Tasks",
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      PraxisChip(label: '${items.length}'),
                      OutlinedButton(
                        onPressed: () => context.go('/calendar'),
                        child: const Text('View Calendar'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (items.isEmpty)
                    const Text('Generate a campaign to create review tasks.')
                  else
                    for (final item in items)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: praxisMint,
                          child: Icon(
                            Icons.article_outlined,
                            color: _statusColor(item.status),
                          ),
                        ),
                        title: Text(item.title),
                        subtitle: Text(
                          '${categoryLabel(item.category)} - ${item.status}',
                        ),
                        trailing: OutlinedButton(
                          onPressed: () => context.go('/content/${item.id}'),
                          child: const Text('Review'),
                        ),
                      ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Performance Overview',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 160,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(
                        12,
                        (index) => Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 38 + ((index * 17) % 104).toDouble(),
                            decoration: BoxDecoration(
                              color: index.isEven
                                  ? praxisPurple.withValues(alpha: 0.25)
                                  : praxisTeal.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
        final right = Column(
          children: [
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Upcoming Schedule',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  for (final item in state.items.take(5))
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: PraxisChip(label: 'Day ${item.dayOffset + 1}'),
                      title: Text(item.title),
                      subtitle: Text(categoryLabel(item.category)),
                    ),
                  if (state.items.isEmpty)
                    const Text('No scheduled content yet.'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PraxisCard(
              color: praxisPurple.withValues(alpha: 0.06),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  PraxisChip(
                    label: 'AI Recommendations',
                    icon: Icons.auto_awesome,
                  ),
                  SizedBox(height: 14),
                  Text('Create more content around high-intent services.'),
                  SizedBox(height: 8),
                  Text(
                    'Keep generated content in review/export mode for the MVP.',
                  ),
                ],
              ),
            ),
          ],
        );

        if (!twoColumns) {
          return Column(children: [left, const SizedBox(height: 16), right]);
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 3, child: left),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: right),
          ],
        );
      },
    );
  }
}

class GenerateContentScreen extends ConsumerWidget {
  const GenerateContentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Content Conveyor Belt',
      subtitle: 'Input a topic. Get a safe content package ready for review.',
      currentRoute: '/generate',
      primaryAction: FilledButton.icon(
        onPressed: () async {
          await ref.read(praxisProvider.notifier).generateThirtyDayCampaign();
          if (context.mounted) {
            context.go('/calendar');
          }
        },
        icon: const Icon(Icons.auto_awesome),
        label: const Text('Generate Content'),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 980;
          final input = _GenerateInputPanel(state: state);
          final output = _GeneratedPackagePanel(state: state);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PraxisCard(
                child: _GenerateSteps(compact: constraints.maxWidth < 620),
              ),
              const SizedBox(height: 18),
              if (wide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 410, child: input),
                    const SizedBox(width: 18),
                    Expanded(child: output),
                  ],
                )
              else
                Column(children: [input, const SizedBox(height: 18), output]),
            ],
          );
        },
      ),
    );
  }
}

class _StepPill extends StatelessWidget {
  const _StepPill({
    required this.number,
    required this.title,
    required this.text,
  });

  final String number;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          backgroundColor: number == '1' ? praxisPurple : praxisMint,
          foregroundColor: number == '1' ? Colors.white : praxisTealDark,
          child: Text(
            number,
            style: const TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              Text(text, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _GenerateSteps extends StatelessWidget {
  const _GenerateSteps({required this.compact});

  final bool compact;

  static const _steps = [
    _StepPill(number: '1', title: 'Topic', text: 'Tell us what to create'),
    _StepPill(number: '2', title: 'Generate', text: 'Draft the package'),
    _StepPill(number: '3', title: 'Review', text: 'Customize and approve'),
    _StepPill(number: '4', title: 'Export', text: 'Manual copy only'),
  ];

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          for (final step in _steps) SizedBox(width: 138, child: step),
        ],
      );
    }

    return Row(
      children: const [
        Expanded(
          child: _StepPill(
            number: '1',
            title: 'Topic',
            text: 'Tell us what to create',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '2',
            title: 'Generate',
            text: 'Draft the package',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '3',
            title: 'Review',
            text: 'Customize and approve',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '4',
            title: 'Export',
            text: 'Manual copy only',
          ),
        ),
      ],
    );
  }
}

class _GenerateInputPanel extends ConsumerWidget {
  const _GenerateInputPanel({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisChip(
            label: 'Tell us about your content',
            icon: Icons.edit,
          ),
          const SizedBox(height: 18),
          _ReadonlySelect(
            label: 'Specialty',
            value: state.doctor?.specialty ?? 'ENT',
            icon: Icons.medical_services_outlined,
          ),
          _ReadonlySelect(
            label: 'Topic / Condition',
            value: state.clinic?.services.firstOrNull ?? 'Sinus consultation',
            icon: Icons.topic_outlined,
          ),
          const _ReadonlySelect(
            label: 'Content Type',
            value: '30-day campaign package',
            icon: Icons.calendar_month_outlined,
          ),
          const _ReadonlySelect(
            label: 'Audience',
            value: 'Patients',
            icon: Icons.groups_2_outlined,
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: () async {
              await ref
                  .read(praxisProvider.notifier)
                  .generateThirtyDayCampaign();
              if (context.mounted) {
                context.go('/calendar');
              }
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate Content'),
          ),
          const SizedBox(height: 10),
          Text(
            'Estimated time: instant fake provider for MVP smoke tests.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ReadonlySelect extends StatelessWidget {
  const _ReadonlySelect({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: praxisSurface,
              border: Border.all(color: praxisLine),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(icon, color: praxisPurple),
                const SizedBox(width: 10),
                Expanded(child: Text(value)),
                const Icon(Icons.keyboard_arrow_down, color: praxisMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GeneratedPackagePanel extends StatelessWidget {
  const _GeneratedPackagePanel({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final sample = state.items.take(3).toList();
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const PraxisChip(
                label: 'Review package',
                icon: Icons.check_circle,
              ),
              OutlinedButton.icon(
                onPressed: () => context.go('/calendar'),
                icon: const Icon(Icons.calendar_month_outlined),
                label: const Text('Open Calendar'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: const [
              _PackageTile(
                icon: Icons.movie_creation_outlined,
                label: 'Reel Script',
              ),
              _PackageTile(icon: Icons.image_outlined, label: 'Thumbnail'),
              _PackageTile(icon: Icons.notes_outlined, label: 'Caption'),
              _PackageTile(icon: Icons.tag, label: 'Hashtags'),
              _PackageTile(icon: Icons.campaign_outlined, label: 'CTA'),
            ],
          ),
          const SizedBox(height: 20),
          if (sample.isEmpty)
            const Text('Generate a campaign to fill this package.')
          else
            for (var i = 0; i < sample.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ContentMiniCard(item: sample[i], index: i),
              ),
        ],
      ),
    );
  }
}

class _PackageTile extends StatelessWidget {
  const _PackageTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 124,
      child: PraxisCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: praxisPurple),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center),
            const SizedBox(height: 5),
            const Text(
              'Ready',
              style: TextStyle(color: Color(0xFF009E73), fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Calendar',
      subtitle: 'Plan, review and stay consistent with your content.',
      currentRoute: '/calendar',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Create Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilledButton(
            onPressed: () async =>
                ref.read(praxisProvider.notifier).generateThirtyDayCampaign(),
            child: const Text('Generate 30-day campaign'),
          ),
          const SizedBox(height: 18),
          if (state.campaign == null)
            const EmptyCampaignPanel()
          else
            CampaignReadyPanel(state: state),
        ],
      ),
    );
  }
}

class EmptyCampaignPanel extends StatelessWidget {
  const EmptyCampaignPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'No campaign yet',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text(
            'Generate a deterministic 30-day MVP campaign to populate your calendar.',
          ),
        ],
      ),
    );
  }
}

class CampaignReadyPanel extends StatelessWidget {
  const CampaignReadyPanel({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          state.campaign!.title,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 6),
        Text('Content ideas: ${state.items.length}'),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 1050;
            final calendar = PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const PraxisChip(
                        label: 'Calendar View',
                        icon: Icons.calendar_month_outlined,
                      ),
                      const PraxisChip(
                        label: 'Week View',
                        color: Color(0xFFF3F0FF),
                      ),
                      const PraxisChip(
                        label: 'List View',
                        color: Color(0xFFF3F0FF),
                      ),
                      OutlinedButton(
                        onPressed: () {},
                        child: const Text('All Platforms'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (var i = 0; i < state.items.take(14).length; i++)
                        SizedBox(
                          width: 150,
                          child: CalendarDayCard(
                            item: state.items[i],
                            index: i,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            );
            final summary = CampaignSummaryCard(state: state);
            if (!wide) {
              return Column(
                children: [calendar, const SizedBox(height: 16), summary],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 4, child: calendar),
                const SizedBox(width: 16),
                Expanded(child: summary),
              ],
            );
          },
        ),
      ],
    );
  }
}

class CalendarDayCard extends StatelessWidget {
  const CalendarDayCard({required this.item, required this.index, super.key});

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/content/${item.id}'),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: praxisSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: praxisLine),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Day ${item.dayOffset + 1}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  PraxisChip(
                    label: categoryLabel(item.category),
                    color: _categoryTint(item.category),
                    foreground: _statusColor(item.status),
                  ),
                ],
              ),
            ),
            MedicalThumbnail(
              title: item.title.replaceFirst(RegExp(r'^Day \d+: '), ''),
              category: item.category,
              index: index,
              aspectRatio: 1,
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CampaignSummaryCard extends StatelessWidget {
  const CampaignSummaryCard({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Campaign Summary',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _summaryRow(
            Icons.rocket_launch_outlined,
            'Campaign Goal',
            state.campaign!.goal,
          ),
          _summaryRow(
            Icons.health_and_safety_outlined,
            'Specialty Focus',
            state.doctor?.specialty ?? 'Specialty',
          ),
          _summaryRow(
            Icons.topic_outlined,
            'Focus Areas',
            state.clinic?.services.join(', ') ?? 'Services',
          ),
          _summaryRow(
            Icons.calendar_month_outlined,
            'Start Date',
            _formatDate(state.campaign!.startDate),
          ),
          _summaryRow(
            Icons.fact_check_outlined,
            'Posting Frequency',
            '1 item per day',
          ),
          const SizedBox(height: 12),
          PraxisCard(
            color: const Color(0xFFFFF8E8),
            child: Text(
              'All content remains review/export only. No social publishing is enabled in MVP.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: praxisPurple.withValues(alpha: 0.08),
            foregroundColor: praxisPurple,
            child: Icon(icon, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: praxisMuted, fontSize: 12),
                ),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ContentLibraryScreen extends ConsumerWidget {
  const ContentLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Content Library',
      subtitle: 'All your content in one place.',
      currentRoute: '/library',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Generate New Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              const PraxisChip(
                label: 'All Content',
                color: Color(0xFFF3F0FF),
                foreground: praxisPurple,
              ),
              PraxisChip(
                label:
                    'Drafts ${state.items.where((item) => item.status == 'drafted').length}',
              ),
              const PraxisChip(
                label: 'Scheduled 0',
                color: Color(0xFFFFF2E4),
                foreground: Color(0xFFB96B00),
              ),
              const PraxisChip(label: 'Published 0', color: praxisMint),
            ],
          ),
          const SizedBox(height: 18),
          if (state.items.isEmpty)
            const EmptyCampaignPanel()
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                final columns = width >= 1180
                    ? 4
                    : width >= 860
                    ? 3
                    : width >= 560
                    ? 2
                    : 1;
                final cardWidth = (width - ((columns - 1) * 16)) / columns;
                return Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    for (var i = 0; i < state.items.length; i++)
                      SizedBox(
                        width: cardWidth,
                        child: ContentLibraryCard(
                          item: state.items[i],
                          index: i,
                        ),
                      ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}

class ContentLibraryCard extends StatelessWidget {
  const ContentLibraryCard({
    required this.item,
    required this.index,
    super.key,
  });

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/content/${item.id}'),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: praxisSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: praxisLine),
          boxShadow: [
            BoxShadow(
              color: praxisInk.withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MedicalThumbnail(
              title: item.title,
              category: item.category,
              index: index,
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  PraxisChip(
                    label: categoryLabel(item.category),
                    color: _categoryTint(item.category),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 16,
                        color: praxisMuted,
                      ),
                      const SizedBox(width: 6),
                      Text('Day ${item.dayOffset + 1}'),
                      const Spacer(),
                      PraxisChip(label: item.status),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContentMiniCard extends StatelessWidget {
  const ContentMiniCard({required this.item, required this.index, super.key});

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 110,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: MedicalThumbnail(
              title: item.title,
              category: item.category,
              index: index,
              aspectRatio: 1.35,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(item.caption, maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ],
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
    return WorkspaceShell(
      title: item.title,
      subtitle: 'Review, edit and manually export this content package.',
      currentRoute: '/library',
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 900;
          final editor = PraxisCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Caption', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                TextField(
                  key: const Key('captionField'),
                  controller: _caption,
                  maxLines: 8,
                  decoration: const InputDecoration(
                    labelText: 'Caption',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
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
                    OutlinedButton.icon(
                      onPressed: () {
                        final updated = ref
                            .read(praxisProvider)
                            .items
                            .firstWhere(
                              (candidate) => candidate.id == widget.itemId,
                            );
                        final package =
                            'Title: ${updated.title}\nCaption: ${updated.caption}\nCTA: ${updated.shortCta}\nReel script: ${updated.reelScript}';
                        Clipboard.setData(ClipboardData(text: package));
                        setState(() => _postPackageCopied = true);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Post package copied')),
                        );
                      },
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy post package'),
                    ),
                  ],
                ),
                if (_postPackageCopied) ...[
                  const SizedBox(height: 12),
                  const PraxisChip(
                    label: 'Post package copied',
                    icon: Icons.check,
                  ),
                ],
              ],
            ),
          );
          final preview = PraxisCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MedicalThumbnail(
                  title: item.title,
                  category: item.category,
                  index: item.dayOffset,
                  aspectRatio: 1.15,
                ),
                const SizedBox(height: 14),
                PraxisChip(
                  label: categoryLabel(item.category),
                  color: _categoryTint(item.category),
                ),
                const SizedBox(height: 12),
                Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text('CTA: ${item.shortCta}'),
                const SizedBox(height: 8),
                Text(item.reelScript),
              ],
            ),
          );
          if (!wide) {
            return Column(
              children: [editor, const SizedBox(height: 16), preview],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: preview),
              const SizedBox(width: 16),
              Expanded(flex: 2, child: editor),
            ],
          );
        },
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
    return WorkspaceShell(
      title: 'Brand Settings',
      subtitle: 'Customize your identity and keep content consistent.',
      currentRoute: '/brand',
      primaryAction: FilledButton.icon(
        onPressed: () async => _save(context),
        icon: const Icon(Icons.save_outlined),
        label: const Text('Save Changes'),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 980;
          final form = Column(
            children: [
              PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Clinic Identity',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _brandInfo(
                      'Clinic Name',
                      state.clinic?.name ?? 'Clinic name',
                    ),
                    _brandInfo(
                      'Doctor Name',
                      state.doctor?.name ?? 'Doctor name',
                    ),
                    _brandInfo(
                      'Specialty',
                      state.doctor?.specialty ?? 'Specialty',
                    ),
                    _brandInfo('Tone', state.brandKit.tone),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Content Defaults',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () async => _save(context),
                        icon: const Icon(Icons.save_outlined),
                        label: const Text('Save brand kit'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      key: const Key('primaryColorField'),
                      controller: _primaryColor,
                      decoration: const InputDecoration(
                        labelText: 'Primary color',
                        prefixIcon: Icon(Icons.color_lens_outlined),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      key: const Key('ctaField'),
                      controller: _cta,
                      decoration: const InputDecoration(
                        labelText: 'Default CTA',
                        prefixIcon: Icon(Icons.campaign_outlined),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
          final preview = BrandPreview(state: state);
          if (!wide) {
            return Column(
              children: [form, const SizedBox(height: 16), preview],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 2, child: form),
              const SizedBox(width: 16),
              Expanded(child: preview),
            ],
          );
        },
      ),
    );
  }

  Widget _brandInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          SizedBox(
            width: 132,
            child: Text(label, style: const TextStyle(color: praxisMuted)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save(BuildContext context) async {
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
  }
}

class BrandPreview extends StatelessWidget {
  const BrandPreview({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final brandColor = parseBrandColor(state.brandKit.primaryColor);
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Live Preview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: brandColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: Colors.white,
                      foregroundColor: praxisTealDark,
                      child: Icon(Icons.local_hospital_outlined),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.clinic?.name ?? 'Clinic name',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          letterSpacing: 0,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Text(
                  state.items.isEmpty
                      ? 'Patient Education'
                      : state.items.first.title.replaceFirst(
                          RegExp(r'^Day \d+: '),
                          '',
                        ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: praxisGold,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    state.brandKit.defaultCta,
                    style: const TextStyle(
                      color: praxisInk,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                Text(
                  state.brandKit.disclaimer,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.82)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Settings',
      subtitle: 'Manage your account, preferences and application settings.',
      currentRoute: '/settings',
      child: Column(
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 900;
              final profile = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Profile Information',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 36,
                          backgroundColor: praxisMint,
                          child: Icon(Icons.person, color: praxisTealDark),
                        ),
                        const SizedBox(width: 18),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                state.doctor?.name ?? 'Doctor',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              Text(state.doctor?.specialty ?? 'Specialty'),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 30),
                    Text('Clinic: ${state.clinic?.name ?? 'No clinic'}'),
                    Text('Phone: ${state.clinic?.phone ?? '-'}'),
                    Text('Language: English (India)'),
                  ],
                ),
              );
              final preferences = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Preferences',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _settingsRow(
                      Icons.camera_alt_outlined,
                      'Default Platform',
                      'Manual export',
                    ),
                    _settingsRow(
                      Icons.article_outlined,
                      'Default Content Type',
                      'Education post',
                    ),
                    _settingsRow(
                      Icons.language_outlined,
                      'Default Language',
                      'English (India)',
                    ),
                    _settingsRow(
                      Icons.tune_outlined,
                      'Default Tone',
                      state.brandKit.tone,
                    ),
                  ],
                ),
              );
              if (!wide) {
                return Column(
                  children: [profile, const SizedBox(height: 16), preferences],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: profile),
                  const SizedBox(width: 16),
                  Expanded(child: preferences),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          PraxisCard(
            child: Row(
              children: [
                const Icon(Icons.privacy_tip_outlined, color: praxisPurple),
                const SizedBox(width: 14),
                const Expanded(
                  child: Text(
                    'Data and privacy controls are MVP-safe: no patient-identifiable generation data is requested.',
                  ),
                ),
                OutlinedButton(
                  onPressed: () {
                    ref.read(praxisProvider.notifier).signOut();
                    context.go('/signin');
                  },
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingsRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: praxisMuted),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class PlaceholderFeatureScreen extends StatelessWidget {
  const PlaceholderFeatureScreen({
    required this.route,
    required this.title,
    required this.message,
    required this.icon,
    super.key,
  });

  final String route;
  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return WorkspaceShell(
      title: title,
      subtitle: 'Visual placeholder only. This area is intentionally deferred.',
      currentRoute: route,
      child: ComingSoonPanel(title: title, message: message, icon: icon),
    );
  }
}

Color _statusColor(String status) {
  return switch (status) {
    'posted' => const Color(0xFF009E73),
    'designed' => praxisPurple,
    'drafted' => praxisTealDark,
    _ => praxisMuted,
  };
}

Color _categoryTint(String category) {
  return switch (category) {
    'myth_buster' => const Color(0xFFFFF2E4),
    'symptoms' => const Color(0xFFE8F2FF),
    'procedure_explainer' => const Color(0xFFF3F0FF),
    'seasonal_health_tip' => const Color(0xFFE9F8EF),
    'clinic_service' => praxisMint,
    'faq' => const Color(0xFFFFEDF4),
    _ => const Color(0xFFF3F0FF),
  };
}

String _formatDate(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}
