import '../core/utils/uuid_helpers.dart';
import '../domain/entities/praxis_models.dart';
import '../domain/services/praxis_generation_client.dart';

class CampaignPackage {
  const CampaignPackage({required this.campaign, required this.items});

  final ContentCampaign campaign;
  final List<ContentItem> items;
}

class CampaignPackageGenerator {
  const CampaignPackageGenerator();

  Future<CampaignPackage?> generate({
    required PraxisState state,
    required int durationDays,
    PraxisGenerationClient? generationClient,
  }) async {
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null) {
      return null;
    }

    final campaign = ContentCampaign(
      id: newUuid(),
      title: '$durationDays-day ${doctor.specialty} Growth Campaign',
      goal: 'increase appointment enquiries',
      durationDays: durationDays,
      startDate: DateTime.now(),
    );
    final planItems =
        await generationClient?.generateCampaignPlan(
          state: state,
          durationDays: durationDays,
        ) ??
        _deterministicCampaignPlan(state, durationDays);
    final items = [
      for (final item in planItems)
        ContentItem(
          id: newUuid(),
          campaignId: campaign.id,
          dayOffset: item.dayOffset,
          title: item.title,
          category: item.category,
          status: 'drafted',
          caption: item.caption,
          shortCta: item.shortCta,
          reelScript: item.reelScript,
        ),
    ];

    return CampaignPackage(campaign: campaign, items: items);
  }

  List<GeneratedCampaignPlanItem> _deterministicCampaignPlan(
    PraxisState state,
    int durationDays,
  ) {
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null) {
      return const [];
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
    return List.generate(durationDays, (index) {
      final category = categories[index % categories.length];
      final service = clinic.services[index % clinic.services.length];
      final label = categoryLabels[category]!;
      return GeneratedCampaignPlanItem(
        dayOffset: index,
        title: 'Day ${index + 1}: $label for $service',
        category: category,
        caption:
            'A patient-friendly $label post about $service for ${clinic.locality}. This is general education and should be reviewed by ${doctor.name}.',
        shortCta: state.brandKit.defaultCta,
        reelScript:
            'Open with a common concern, explain one safe care tip, and close with ${state.brandKit.defaultCta}.',
      );
    });
  }
}
