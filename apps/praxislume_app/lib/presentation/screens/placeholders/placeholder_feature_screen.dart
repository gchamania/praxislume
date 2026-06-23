import 'package:flutter/material.dart';

import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';

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
      subtitle:
          'Prototype-style preview only. This area is intentionally deferred.',
      currentRoute: route,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PreviewOnlyBanner(),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 960;
              final hero = _PreviewHero(
                title: title,
                message: message,
                icon: icon,
              );
              final side = _DeferredScopePanel(route: route);
              if (!wide) {
                return Column(
                  children: [hero, const SizedBox(height: 16), side],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 3, child: hero),
                  const SizedBox(width: 16),
                  Expanded(flex: 2, child: side),
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          _PreviewGrid(route: route),
        ],
      ),
    );
  }
}

class _PreviewHero extends StatelessWidget {
  const _PreviewHero({
    required this.title,
    required this.message,
    required this.icon,
  });

  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: praxisPurple.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: praxisPurple, size: 32),
          ),
          const SizedBox(height: 18),
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(message),
          const SizedBox(height: 22),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: const [
              PlatformChip(
                label: 'Manual review',
                icon: Icons.fact_check_outlined,
              ),
              PlatformChip(
                label: 'Automation',
                icon: Icons.auto_mode_outlined,
                enabled: false,
              ),
              PlatformChip(
                label: 'Publishing',
                icon: Icons.publish_outlined,
                enabled: false,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DeferredScopePanel extends StatelessWidget {
  const _DeferredScopePanel({required this.route});

  final String route;

  @override
  Widget build(BuildContext context) {
    final bullets = switch (route) {
      '/templates' => const [
        'Template marketplace is deferred until campaign usage is validated.',
        'Current MVP uses deterministic thumbnails and manual export.',
        'No freeform design canvas is being introduced here.',
      ],
      '/analytics' => const [
        'Analytics need real pilot usage data before becoming active.',
        'Charts below use deterministic mock metrics only.',
        'No ROI claims or automated patient attribution are active.',
      ],
      _ => const [
        'Media Studio is not active in the MVP.',
        'No avatar, AI video, voice generation, or social publishing calls exist.',
        'Future video helpers should support doctor-recorded content first.',
      ],
    };
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Deferred Scope', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          for (final bullet in bullets)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.lock_clock_outlined,
                    color: praxisMuted,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(bullet)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _PreviewGrid extends StatelessWidget {
  const _PreviewGrid({required this.route});

  final String route;

  @override
  Widget build(BuildContext context) {
    final cards = switch (route) {
      '/templates' => const [
        ('Clinic awareness post', Icons.health_and_safety_outlined),
        ('FAQ carousel preview', Icons.view_carousel_outlined),
        ('Service explainer tile', Icons.medical_services_outlined),
        ('Poster export concept', Icons.article_outlined),
      ],
      '/analytics' => const [
        ('Topic interest trend', Icons.trending_up),
        ('Manual enquiry notes', Icons.edit_note_outlined),
        ('Platform comparison', Icons.bar_chart_outlined),
        ('Campaign summary', Icons.pie_chart_outline),
      ],
      _ => const [
        ('Reel script assist', Icons.movie_creation_outlined),
        ('Thumbnail title concept', Icons.image_outlined),
        ('Lower-third overlay', Icons.subtitles_outlined),
        ('Doctor-recorded video later', Icons.video_library_outlined),
      ],
    };
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 1120
            ? 4
            : constraints.maxWidth >= 760
            ? 2
            : 1;
        final width = (constraints.maxWidth - (columns - 1) * 16) / columns;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            for (var i = 0; i < cards.length; i++)
              SizedBox(
                width: width,
                child: PraxisCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MedicalThumbnail(
                        title: cards[i].$1,
                        category: i.isEven ? 'awareness' : 'faq',
                        index: i,
                        aspectRatio: 1.35,
                      ),
                      const SizedBox(height: 14),
                      Icon(cards[i].$2, color: praxisPurple),
                      const SizedBox(height: 10),
                      Text(
                        cards[i].$1,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      const StatusBadge(
                        label: 'Preview only',
                        color: Color(0xFFF3F5F9),
                        foreground: praxisMuted,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
