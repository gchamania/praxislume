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
      subtitle:
          'All your content in one place. Search, filter and manage your assets.',
      currentRoute: '/library',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Generate New Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PraxisCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final compactHeader = constraints.maxWidth < 980;
                      final tabs = Wrap(
                        spacing: 4,
                        runSpacing: 0,
                        children: [
                          _TabLabel(
                            label: 'All Content',
                            active: true,
                            count: state.items.length,
                          ),
                          const _TabLabel(label: 'Published', count: 0),
                          const _TabLabel(label: 'Scheduled', count: 0),
                          _TabLabel(
                            label: 'Drafts',
                            count: state.items
                                .where((item) => item.status == 'drafted')
                                .length,
                          ),
                        ],
                      );
                      final search = Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: compactHeader ? constraints.maxWidth : 320,
                            child: TextField(
                              enabled: false,
                              decoration: const InputDecoration(
                                hintText: 'Search content, topic, type...',
                                prefixIcon: Icon(Icons.search),
                              ),
                            ),
                          ),
                          if (!compactHeader) const SizedBox(width: 12),
                          if (!compactHeader)
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.filter_list),
                              label: const Text('Filters'),
                            ),
                        ],
                      );
                      if (compactHeader) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              tabs,
                              const SizedBox(height: 12),
                              search,
                              const SizedBox(height: 10),
                              OutlinedButton.icon(
                                onPressed: () {},
                                icon: const Icon(Icons.filter_list),
                                label: const Text('Filters'),
                              ),
                            ],
                          ),
                        );
                      }
                      return Row(
                        children: [
                          Expanded(child: tabs),
                          search,
                        ],
                      );
                    },
                  ),
                ),
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Wrap(
                    spacing: 14,
                    runSpacing: 14,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: const [
                      _FilterBox(label: 'Content Type', value: 'All'),
                      _FilterBox(label: 'Format', value: 'All'),
                      _FilterBox(label: 'Platform', value: 'Manual export'),
                      _FilterBox(label: 'Topic / Condition', value: 'All'),
                      _FilterBox(label: 'Language', value: 'English'),
                      _FilterBox(label: 'Date', value: 'Newest First'),
                    ],
                  ),
                ),
              ],
            ),
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
                    SizedBox(
                      width: constraints.maxWidth,
                      child: Row(
                        children: [
                          Text(
                            '${state.items.length} Items',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const Spacer(),
                          const PraxisChip(
                            label: 'Grid',
                            icon: Icons.grid_view,
                            color: praxisSidebarActive,
                            foreground: praxisPurple,
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () {},
                            child: const Text('Sort by: Newest First'),
                          ),
                        ],
                      ),
                    ),
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

class _TabLabel extends StatelessWidget {
  const _TabLabel({required this.label, this.count, this.active = false});

  final String label;
  final int? count;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 18, bottom: 16, right: 28),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: active ? praxisPurple : Colors.transparent,
            width: 2,
          ),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              color: active ? praxisPurple : praxisText,
              fontWeight: FontWeight.w800,
              letterSpacing: 0,
            ),
          ),
          if (count != null) ...[
            const SizedBox(width: 8),
            PraxisChip(
              label: '$count',
              color: active ? praxisMint : const Color(0xFFEFF3F8),
              foreground: active ? praxisTealDark : praxisMuted,
            ),
          ],
        ],
      ),
    );
  }
}

class _FilterBox extends StatelessWidget {
  const _FilterBox({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 170,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 7),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: praxisLine),
              borderRadius: BorderRadius.circular(8),
              color: praxisSurface,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down, color: praxisMuted),
              ],
            ),
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
