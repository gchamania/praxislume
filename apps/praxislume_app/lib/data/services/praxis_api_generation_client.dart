import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/exceptions/praxis_api_exception.dart';
import '../../core/utils/json_helpers.dart';
import '../../domain/entities/praxis_models.dart';
import '../../domain/services/praxis_generation_client.dart';

class PraxisApiGenerationClient implements PraxisGenerationClient {
  PraxisApiGenerationClient({
    required SupabaseClient supabase,
    required String baseUrl,
    http.Client? httpClient,
  }) : _supabase = supabase,
       _baseUrl = baseUrl.replaceFirst(RegExp(r'/+$'), ''),
       _httpClient = httpClient ?? http.Client();

  final SupabaseClient _supabase;
  final String _baseUrl;
  final http.Client _httpClient;

  @override
  Future<List<GeneratedCampaignPlanItem>> generateCampaignPlan({
    required PraxisState state,
    required int durationDays,
  }) async {
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null || clinic.id.isEmpty) {
      throw const PraxisApiException(
        'Clinic onboarding is required before generation.',
      );
    }
    final data = await _postJson('/v1/generations/campaign-plan', {
      'clinicId': clinic.id,
      'idempotencyKey':
          'campaign-${clinic.id}-$durationDays-${DateTime.now().toUtc().millisecondsSinceEpoch}',
      'durationDays': durationDays,
      'specialty': doctor.specialty,
      'services': clinic.services,
      'locality': clinic.locality,
      'goal': 'increase appointment enquiries',
      'tone': state.brandKit.tone,
      'ctaPreference': state.brandKit.defaultCta,
      'disclaimerPreference': state.brandKit.disclaimer,
    });
    final items = data['items'];
    if (items is! List) {
      throw const PraxisApiException('Campaign plan response was invalid.');
    }
    return [
      for (final item in items)
        if (item is Map)
          GeneratedCampaignPlanItem(
            dayOffset: readInt(Map<String, dynamic>.from(item), 'dayOffset'),
            title: readText(Map<String, dynamic>.from(item), 'title'),
            category: readText(Map<String, dynamic>.from(item), 'category'),
            caption: readText(Map<String, dynamic>.from(item), 'caption'),
            shortCta: readText(Map<String, dynamic>.from(item), 'shortCta'),
            reelScript: readText(Map<String, dynamic>.from(item), 'reelScript'),
          ),
    ];
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
    final data = await _postJson('/v1/generations/content-item-caption', {
      'clinicId': clinicId,
      'title': title,
      'specialty': specialty,
      'tone': tone,
      'keyPoints': keyPoints,
      'ctaPreference': ctaPreference,
      if (disclaimerPreference != null)
        'disclaimerPreference': disclaimerPreference,
    });
    return CaptionDraft(
      caption: readText(data, 'caption'),
      shortCta: readText(data, 'shortCta'),
      disclaimerNeeded: data['disclaimerNeeded'] == true,
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
    final data = await _postJson('/v1/generations/reel-script', {
      'clinicId': clinicId,
      'title': title,
      'specialty': specialty,
      'tone': tone,
      'keyPoints': keyPoints,
      'ctaPreference': ctaPreference,
    });
    return ReelScriptDraft(
      reelHook: readText(data, 'reelHook'),
      reelScript: readText(data, 'reelScript'),
      shortCta: readText(data, 'shortCta'),
    );
  }

  @override
  Future<String> rewriteTone({
    required String clinicId,
    required String content,
    required String tone,
  }) async {
    final data = await _postJson('/v1/generations/tone-rewrite', {
      'clinicId': clinicId,
      'content': content,
      'tone': tone,
    });
    return readText(data, 'rewrittenContent');
  }

  @override
  Future<ComplianceReviewDraft> reviewCompliance({
    required String clinicId,
    required String content,
    required String contentVersionHash,
  }) async {
    final data = await _postJson('/v1/compliance/review', {
      'clinicId': clinicId,
      'content': content,
      'contentVersionHash': contentVersionHash,
    });
    return ComplianceReviewDraft(
      status: readText(data, 'status'),
      issueCodes: readStringList(data['issueCodes']),
      notes: readStringList(data['notes']),
      saferRewrite: nullableText(data, 'saferRewrite'),
      reviewedContentVersionHash: readText(data, 'reviewedContentVersionHash'),
    );
  }

  @override
  Future<GeneratedVisualAsset> generateVisualAsset({
    required PraxisState state,
    required ContentItem item,
  }) async {
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null || clinic.id.isEmpty) {
      throw const PraxisApiException(
        'Clinic onboarding is required before visual generation.',
      );
    }

    final data = await _postJson('/v1/generations/visual-asset', {
      'clinicId': clinic.id,
      'contentItemId': item.id,
      'title': item.title,
      'specialty': doctor.specialty,
      'category': item.category,
      'tone': state.brandKit.tone,
      'clinicName': clinic.name,
      'doctorName': doctor.name,
      'shortCta': item.shortCta.isEmpty
          ? state.brandKit.defaultCta
          : item.shortCta,
      'disclaimer': state.brandKit.disclaimer,
      'brandColors': {
        'primary': state.brandKit.primaryColor,
        'accent': state.brandKit.accentColor,
      },
      'visualStyle': 'clean_medical_abstract',
      if (state.brandKit.logoPath != null) 'logoPath': state.brandKit.logoPath,
    });

    return _readGeneratedVisualAsset(data);
  }

  @override
  Future<GeneratedVisualAsset?> fetchLatestVisualAsset({
    required String clinicId,
    required String contentItemId,
  }) async {
    final query = Uri(
      queryParameters: {'clinicId': clinicId, 'contentItemId': contentItemId},
    ).query;
    final data = await _getJson('/v1/generations/visual-asset/latest?$query');
    if (data == null) {
      return null;
    }
    return _readGeneratedVisualAsset(data);
  }

  GeneratedVisualAsset _readGeneratedVisualAsset(Map<String, dynamic> data) {
    return GeneratedVisualAsset(
      assetId: readText(data, 'assetId'),
      storagePath: readText(data, 'storagePath'),
      mimeType: readText(data, 'mimeType'),
      width: readInt(data, 'width'),
      height: readInt(data, 'height'),
      signedUrl: readText(data, 'signedUrl'),
      expiresInSeconds: readInt(data, 'expiresInSeconds'),
    );
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null || token.isEmpty) {
      throw const PraxisApiException('A Supabase session is required.');
    }
    final response = await _httpClient.post(
      Uri.parse('$_baseUrl$path'),
      headers: {
        'authorization': 'Bearer $token',
        'content-type': 'application/json',
      },
      body: jsonEncode(body),
    );
    final envelope = jsonDecode(response.body);
    if (envelope is! Map) {
      throw const PraxisApiException('API response was invalid.');
    }
    final parsed = Map<String, dynamic>.from(envelope);
    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        parsed['ok'] != true) {
      final error = parsed['error'];
      final message = error is Map
          ? readText(Map<String, dynamic>.from(error), 'message')
          : 'Generation request failed.';
      throw PraxisApiException(message);
    }
    final data = parsed['data'];
    if (data is! Map) {
      throw const PraxisApiException('API response data was invalid.');
    }
    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>?> _getJson(String path) async {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null || token.isEmpty) {
      throw const PraxisApiException('A Supabase session is required.');
    }
    final response = await _httpClient.get(
      Uri.parse('$_baseUrl$path'),
      headers: {'authorization': 'Bearer $token'},
    );
    final envelope = jsonDecode(response.body);
    if (envelope is! Map) {
      throw const PraxisApiException('API response was invalid.');
    }
    final parsed = Map<String, dynamic>.from(envelope);
    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        parsed['ok'] != true) {
      final error = parsed['error'];
      final message = error is Map
          ? readText(Map<String, dynamic>.from(error), 'message')
          : 'Generation request failed.';
      throw PraxisApiException(message);
    }
    final data = parsed['data'];
    if (data == null) {
      return null;
    }
    if (data is! Map) {
      throw const PraxisApiException('API response data was invalid.');
    }
    return Map<String, dynamic>.from(data);
  }
}
