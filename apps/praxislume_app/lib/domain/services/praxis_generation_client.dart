import '../entities/praxis_models.dart';

abstract class PraxisGenerationClient {
  Future<List<GeneratedCampaignPlanItem>> generateCampaignPlan({
    required PraxisState state,
    required int durationDays,
  });

  Future<CaptionDraft> generateCaption({
    required String clinicId,
    required String title,
    required String specialty,
    required String tone,
    required List<String> keyPoints,
    required String ctaPreference,
    String? disclaimerPreference,
  });

  Future<ReelScriptDraft> generateReelScript({
    required String clinicId,
    required String title,
    required String specialty,
    required String tone,
    required List<String> keyPoints,
    required String ctaPreference,
  });

  Future<String> rewriteTone({
    required String clinicId,
    required String content,
    required String tone,
  });

  Future<ComplianceReviewDraft> reviewCompliance({
    required String clinicId,
    required String content,
    required String contentVersionHash,
  });

  Future<GeneratedVisualAsset> generateVisualAsset({
    required PraxisState state,
    required ContentItem item,
  });

  Future<GeneratedVisualAsset?> fetchLatestVisualAsset({
    required String clinicId,
    required String contentItemId,
  });
}
