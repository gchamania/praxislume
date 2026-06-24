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
    this.carouselSlides = const [],
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
  final List<CarouselSlide> carouselSlides;

  ContentItem copyWith({
    String? status,
    String? caption,
    String? shortCta,
    String? reelScript,
    List<CarouselSlide>? carouselSlides,
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
      carouselSlides: carouselSlides ?? this.carouselSlides,
    );
  }
}

class CarouselSlide {
  const CarouselSlide({
    required this.slideNumber,
    required this.role,
    required this.headline,
    required this.body,
    required this.visualCue,
  });

  final int slideNumber;
  final String role;
  final String headline;
  final String body;
  final String visualCue;

  CarouselSlide copyWith({String? headline, String? body, String? visualCue}) {
    return CarouselSlide(
      slideNumber: slideNumber,
      role: role,
      headline: headline ?? this.headline,
      body: body ?? this.body,
      visualCue: visualCue ?? this.visualCue,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slideNumber': slideNumber,
      'role': role,
      'headline': headline,
      'body': body,
      'visualCue': visualCue,
    };
  }

  static CarouselSlide fromJson(Map<String, dynamic> json) {
    return CarouselSlide(
      slideNumber: int.tryParse('${json['slideNumber']}') ?? 1,
      role: '${json['role'] ?? 'education'}',
      headline: '${json['headline'] ?? ''}',
      body: '${json['body'] ?? ''}',
      visualCue: '${json['visualCue'] ?? ''}',
    );
  }
}

class GeneratedCampaignPlanItem {
  const GeneratedCampaignPlanItem({
    required this.dayOffset,
    required this.title,
    required this.category,
    required this.caption,
    required this.shortCta,
    required this.reelScript,
  });

  final int dayOffset;
  final String title;
  final String category;
  final String caption;
  final String shortCta;
  final String reelScript;
}

class CaptionDraft {
  const CaptionDraft({
    required this.caption,
    required this.shortCta,
    required this.disclaimerNeeded,
  });

  final String caption;
  final String shortCta;
  final bool disclaimerNeeded;
}

class ReelScriptDraft {
  const ReelScriptDraft({
    required this.reelHook,
    required this.reelScript,
    required this.shortCta,
  });

  final String reelHook;
  final String reelScript;
  final String shortCta;
}

class ComplianceReviewDraft {
  const ComplianceReviewDraft({
    required this.status,
    required this.issueCodes,
    required this.notes,
    required this.reviewedContentVersionHash,
    this.saferRewrite,
  });

  final String status;
  final List<String> issueCodes;
  final List<String> notes;
  final String reviewedContentVersionHash;
  final String? saferRewrite;
}

class GeneratedVisualAsset {
  const GeneratedVisualAsset({
    required this.assetId,
    required this.storagePath,
    required this.mimeType,
    required this.width,
    required this.height,
    required this.signedUrl,
    required this.expiresInSeconds,
  });

  final String assetId;
  final String storagePath;
  final String mimeType;
  final int width;
  final int height;
  final String signedUrl;
  final int expiresInSeconds;
}

class PraxisState {
  const PraxisState({
    required this.isAuthenticated,
    required this.brandKit,
    this.clinic,
    this.doctor,
    this.campaign,
    this.items = const [],
    this.visualAssetsByContentId = const {},
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
  final Map<String, GeneratedVisualAsset> visualAssetsByContentId;

  bool get onboardingComplete => clinic != null && doctor != null;

  PraxisState copyWith({
    bool? isAuthenticated,
    ClinicProfile? clinic,
    DoctorProfile? doctor,
    BrandKit? brandKit,
    ContentCampaign? campaign,
    List<ContentItem>? items,
    Map<String, GeneratedVisualAsset>? visualAssetsByContentId,
  }) {
    return PraxisState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      clinic: clinic ?? this.clinic,
      doctor: doctor ?? this.doctor,
      brandKit: brandKit ?? this.brandKit,
      campaign: campaign ?? this.campaign,
      items: items ?? this.items,
      visualAssetsByContentId:
          visualAssetsByContentId ?? this.visualAssetsByContentId,
    );
  }
}
