import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import '../../shared/content_helpers.dart';
import '../calendar/calendar_screen.dart';

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
                    color: contentCategoryTint(item.category),
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
