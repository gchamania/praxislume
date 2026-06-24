import type {
  CampaignPlanRequest,
  CampaignPlanResponse,
  CarouselGenerationRequest,
  CarouselGenerationResponse,
  CaptionGenerationRequest,
  ReelScriptRequest,
  ToneRewriteRequest
} from '@praxislume/contracts';

const categories = [
  'awareness',
  'myth_buster',
  'symptoms',
  'procedure_explainer',
  'seasonal_health_tip',
  'clinic_service',
  'faq'
] as const;

export class FakeProvider {
  constructor(private readonly model: string) {}

  generateCampaignPlan(request: CampaignPlanRequest): CampaignPlanResponse {
    return {
      items: Array.from({ length: request.durationDays }, (_, index) => {
        const service = request.services[index % request.services.length];
        const category = categories[index % categories.length];
        return {
          dayOffset: index,
          title: `${request.specialty} ${service} education tip ${index + 1}`,
          category,
          objective: `Help local patients understand ${service.toLowerCase()} and know when to consult.`,
          keyPoints: [
            `Common patient question about ${service}`,
            `Safe signs that deserve a qualified ${request.specialty} consultation`
          ],
          caption: `Many patients delay care because symptoms feel small at first. This ${request.specialty} post explains ${service.toLowerCase()} in simple language for ${request.locality}. Consult a qualified doctor for personal advice.`,
          shortCta: request.ctaPreference,
          hashtags: [`#${request.specialty.replace(/\s+/g, '')}`, '#ClinicEducation'],
          reelHook: `Wondering when ${service.toLowerCase()} needs attention?`,
          reelScript: `Start with the common concern, explain two simple warning signs, and close with: ${request.ctaPreference}.`,
          disclaimerNeeded: true
        };
      })
    };
  }

  generateCaption(request: CaptionGenerationRequest) {
    return {
      caption: `${request.title}: ${request.keyPoints.join(' ')}. This is general education for ${request.specialty} patients. Consult a qualified doctor for advice specific to you.`,
      shortCta: request.ctaPreference,
      disclaimerNeeded: true
    };
  }

  generateReelScript(request: ReelScriptRequest) {
    return {
      reelHook: `${request.title} in 30 seconds`,
      reelScript: `Open with the concern. Explain: ${request.keyPoints.join(' ')}. Close with ${request.ctaPreference}.`,
      shortCta: request.ctaPreference
    };
  }

  rewriteTone(request: ToneRewriteRequest) {
    return {
      rewrittenContent: `[${request.tone}] ${request.content}`
    };
  }

  generateCarouselSlides(request: CarouselGenerationRequest): CarouselGenerationResponse {
    const educationSlides = Math.max(1, request.slideCount - 3);
    const topicPoints = request.keyPoints.length > 0 ? request.keyPoints : [`Understand ${request.title}`];
    const slides: CarouselGenerationResponse['slides'] = [
      {
        slideNumber: 1,
        role: 'cover',
        headline: request.title,
        body: `${request.specialty} patient education from your clinic.`,
        visualCue: `${request.visualStyle} cover using ${request.brandColors.primary}`
      },
      ...Array.from({ length: educationSlides }, (_, index) => {
        const point = topicPoints[index % topicPoints.length];
        return {
          slideNumber: index + 2,
          role: 'education' as const,
          headline: point,
          body: `A simple, safe explanation for patients in ${request.locality ?? 'your area'}.`,
          visualCue: `Branded medical card ${index + 1}`
        };
      }),
      {
        slideNumber: request.slideCount - 1,
        role: 'cta',
        headline: 'Need clarity?',
        body: request.ctaPreference,
        visualCue: 'Clinic CTA footer'
      },
      {
        slideNumber: request.slideCount,
        role: 'disclaimer',
        headline: 'General education',
        body: request.disclaimerPreference,
        visualCue: 'Disclaimer strip'
      }
    ];

    return {
      title: request.title,
      slideCount: request.slideCount,
      visualStyle: request.visualStyle,
      disclaimerText: request.disclaimerPreference,
      slides
    };
  }

  providerName() {
    return 'fake';
  }

  modelName() {
    return this.model;
  }
}
