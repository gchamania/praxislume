import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/utils/date_helpers.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/logo_helpers.dart';
import '../../domain/entities/praxis_models.dart';
import '../../domain/repositories/praxis_repository.dart';

class SupabasePraxisRepository implements PraxisRepository {
  SupabasePraxisRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<PraxisState> load() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return PraxisState.initial();
    }

    final clinics = asRows(
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
    final clinicId = readText(clinicRow, 'id');
    final services =
        asRows(
              await _client
                  .from('clinic_services')
                  .select()
                  .eq('clinic_id', clinicId)
                  .order('name'),
            )
            .map((row) => readText(row, 'name'))
            .where((name) => name.isNotEmpty)
            .toList();
    final doctorRow = await maybeSingle(
      _client
          .from('doctor_profiles')
          .select('*, specialties(name)')
          .eq('clinic_id', clinicId),
    );
    final brandRow = await maybeSingle(
      _client.from('brand_kits').select().eq('clinic_id', clinicId),
    );
    final campaignRows = asRows(
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
        : asRows(
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
        name: readText(clinicRow, 'name'),
        locality: readText(clinicRow, 'locality'),
        city: readText(clinicRow, 'city'),
        services: services,
        phone: readText(clinicRow, 'phone'),
        whatsapp: nullableText(clinicRow, 'whatsapp'),
        appointmentUrl: nullableText(clinicRow, 'appointment_url'),
      ),
      doctor: doctorRow == null
          ? null
          : DoctorProfile(
              id: readText(doctorRow, 'id'),
              name: readText(doctorRow, 'doctor_name'),
              qualifications: readText(doctorRow, 'qualifications'),
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
    final clinicId = readText(clinicRow, 'id');

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
        id: readText(doctorRow, 'id'),
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
  Future<PraxisState> saveBrandLogo({
    required PraxisState currentState,
    required Uint8List bytes,
    required String fileExtension,
    required String contentType,
  }) async {
    final clinic = currentState.clinic;
    if (clinic == null || clinic.id.isEmpty) {
      return currentState;
    }
    final extension = normalizeLogoExtension(fileExtension);
    final path = '${clinic.id}/logo.$extension';
    await _client.storage
        .from('clinic-logos')
        .uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: contentType, upsert: true),
        );
    return saveBrandKit(
      currentState: currentState,
      brandKit: currentState.brandKit.copyWith(logoPath: path),
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
          'start_date': dateOnly(campaign.startDate),
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
            'scheduled_date': dateOnly(
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
    final rows = asRows(
      await _client
          .from('specialties')
          .select('id')
          .ilike('name', specialtyName)
          .limit(1),
    );
    if (rows.isEmpty) {
      return null;
    }
    return nullableText(rows.first, 'id');
  }
}

BrandKit _brandKitFromRow(Map<String, dynamic> row) {
  return BrandKit(
    primaryColor: readText(row, 'primary_color').isEmpty
        ? '#0D4D57'
        : readText(row, 'primary_color'),
    secondaryColor: readText(row, 'secondary_color').isEmpty
        ? '#A7E1D6'
        : readText(row, 'secondary_color'),
    accentColor: readText(row, 'accent_color').isEmpty
        ? '#F2C15E'
        : readText(row, 'accent_color'),
    tone: readText(row, 'tone').isEmpty ? 'warm' : readText(row, 'tone'),
    defaultCta: readText(row, 'default_cta').isEmpty
        ? 'Book a consultation'
        : readText(row, 'default_cta'),
    disclaimer: readText(row, 'disclaimer_text').isEmpty
        ? PraxisState.initial().brandKit.disclaimer
        : readText(row, 'disclaimer_text'),
    logoPath: nullableText(row, 'logo_path'),
  );
}

String _doctorSpecialtyFromRow(Map<String, dynamic> row) {
  final specialty = row['specialties'];
  if (specialty is Map) {
    final name = readText(Map<String, dynamic>.from(specialty), 'name');
    if (name.isNotEmpty) {
      return name;
    }
  }
  return 'Dermatology';
}

ContentCampaign _campaignFromRow(Map<String, dynamic> row) {
  return ContentCampaign(
    id: readText(row, 'id'),
    title: readText(row, 'title'),
    goal: readText(row, 'goal'),
    durationDays: int.tryParse(readText(row, 'duration_days')) ?? 30,
    startDate: DateTime.tryParse(readText(row, 'start_date')) ?? DateTime.now(),
  );
}

ContentItem _contentItemFromRow(Map<String, dynamic> row) {
  return ContentItem(
    id: readText(row, 'id'),
    campaignId: readText(row, 'campaign_id'),
    dayOffset: int.tryParse(readText(row, 'day_offset')) ?? 0,
    title: readText(row, 'title'),
    category: readText(row, 'category'),
    status: readText(row, 'status'),
    caption: readText(row, 'caption'),
    shortCta: readText(row, 'short_cta'),
    reelScript: readText(row, 'reel_script'),
  );
}
