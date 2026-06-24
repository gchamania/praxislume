import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../shared/content_helpers.dart';
import '../../state/praxis_providers.dart';

class CarouselStudioScreen extends ConsumerWidget {
  const CarouselStudioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    final carouselItems = state.items
        .where((item) => item.carouselSlides.isNotEmpty)
        .toList();
    return WorkspaceShell(
      title: 'Carousel Studio',
      subtitle:
          'Structured v0.3 carousel packages with branded templates, editable copy, and manual export.',
      currentRoute: '/carousels',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.auto_awesome),
        label: const Text('Generate campaign'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PraxisCard(
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: const [
                PraxisChip(
                  label: 'v0.3 deterministic templates',
                  icon: Icons.view_carousel_outlined,
                ),
                PlatformChip(label: '5-slide', icon: Icons.view_week_outlined),
                PlatformChip(label: '7-slide', icon: Icons.view_array_outlined),
                PlatformChip(
                  label: 'PDF export next',
                  icon: Icons.picture_as_pdf_outlined,
                  enabled: false,
                ),
                PlatformChip(
                  label: 'No freeform canvas',
                  icon: Icons.lock_outline,
                  enabled: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (state.items.isEmpty)
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const PraxisChip(
                    label: 'Generate a campaign first',
                    icon: Icons.info_outline,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Carousel packages attach to reviewed campaign content items.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    onPressed: () => context.go('/generate'),
                    icon: const Icon(Icons.auto_awesome),
                    label: const Text('Open Generate'),
                  ),
                ],
              ),
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth > 1120
                    ? (constraints.maxWidth - 24) / 3
                    : constraints.maxWidth > 760
                    ? (constraints.maxWidth - 12) / 2
                    : constraints.maxWidth;
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    for (final item in state.items)
                      SizedBox(
                        width: width,
                        child: _CarouselItemCard(
                          item: item,
                          ready: carouselItems.contains(item),
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

class _CarouselItemCard extends StatelessWidget {
  const _CarouselItemCard({required this.item, required this.ready});

  final ContentItem item;
  final bool ready;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MedicalThumbnail(
            title: item.title,
            category: item.category,
            index: item.dayOffset,
            aspectRatio: 1.35,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              PraxisChip(
                label: ready
                    ? '${item.carouselSlides.length} slides ready'
                    : 'Needs carousel',
                color: ready ? const Color(0xFFE9F8EF) : praxisMint,
              ),
              PraxisChip(
                label: categoryLabel(item.category),
                color: contentCategoryTint(item.category),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(item.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            ready
                ? item.carouselSlides.first.headline
                : 'Open this item to generate a structured carousel.',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/content/${item.id}'),
            icon: const Icon(Icons.edit_outlined),
            label: Text(ready ? 'Edit carousel' : 'Create carousel'),
          ),
        ],
      ),
    );
  }
}
