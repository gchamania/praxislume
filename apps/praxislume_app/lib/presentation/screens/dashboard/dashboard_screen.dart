import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import '../../shared/content_helpers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    final doctorName = state.doctor?.name ?? 'Doctor';
    return WorkspaceShell(
      title: 'Good morning, $doctorName',
      subtitle: "Here's your content and growth overview.",
      currentRoute: '/dashboard',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Create New Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Practice snapshot',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (state.clinic != null) ...[
            const SizedBox(height: 6),
            Text(
              state.clinic!.name,
              style: const TextStyle(
                color: praxisTealDark,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) => Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.video_camera_back_outlined,
                    value: '${state.items.length}',
                    label: 'Content ideas',
                    delta: 'Ready for review',
                    tint: praxisPurple,
                  ),
                ),
                _statBox(
                  constraints,
                  const StatCard(
                    icon: Icons.visibility_outlined,
                    value: '45.8K',
                    label: 'Mockup reach target',
                    delta: 'Reference only',
                    tint: praxisTeal,
                  ),
                ),
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.health_and_safety_outlined,
                    value: state.doctor?.specialty ?? 'Specialty',
                    label: 'Specialty focus',
                    tint: praxisGold,
                  ),
                ),
                _statBox(
                  constraints,
                  StatCard(
                    icon: Icons.calendar_month_outlined,
                    value: '${state.campaign?.durationDays ?? 30}',
                    label: 'Campaign days',
                    tint: const Color(0xFF2E79FF),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _DashboardGrid(state: state),
        ],
      ),
    );
  }
}

Widget _statBox(BoxConstraints constraints, Widget child) {
  final width = constraints.maxWidth;
  final columns = width >= 1120
      ? 4
      : width >= 760
      ? 2
      : 1;
  return SizedBox(
    width: (width - ((columns - 1) * 16)) / columns,
    child: child,
  );
}

class _DashboardGrid extends StatelessWidget {
  const _DashboardGrid({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final items = state.items.take(4).toList();
    return LayoutBuilder(
      builder: (context, constraints) {
        final twoColumns = constraints.maxWidth > 960;
        final left = Column(
          children: [
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        "Today's Tasks",
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      PraxisChip(label: '${items.length}'),
                      OutlinedButton(
                        onPressed: () => context.go('/calendar'),
                        child: const Text('View Calendar'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (items.isEmpty)
                    const Text('Generate a campaign to create review tasks.')
                  else
                    for (final item in items) _TaskRow(item: item),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Performance Overview',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 160,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(
                        12,
                        (index) => Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 38 + ((index * 17) % 104).toDouble(),
                            decoration: BoxDecoration(
                              color: index.isEven
                                  ? praxisPurple.withValues(alpha: 0.25)
                                  : praxisTeal.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
        final right = Column(
          children: [
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Upcoming Schedule',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  for (final item in state.items.take(5))
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: PraxisChip(label: 'Day ${item.dayOffset + 1}'),
                      title: Text(item.title),
                      subtitle: Text(categoryLabel(item.category)),
                    ),
                  if (state.items.isEmpty)
                    const Text('No scheduled content yet.'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'Top Performing Content',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (state.items.isEmpty)
                    const Text('Generate content to see top items.')
                  else
                    for (var i = 0; i < state.items.take(4).length; i++)
                      _TopContentRow(item: state.items[i], index: i),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PraxisCard(
              color: praxisPurple.withValues(alpha: 0.06),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  PraxisChip(
                    label: 'AI Recommendations',
                    icon: Icons.auto_awesome,
                  ),
                  SizedBox(height: 14),
                  Text('Create more content around high-intent services.'),
                  SizedBox(height: 8),
                  Text(
                    'Keep generated content in review/export mode for the MVP.',
                  ),
                ],
              ),
            ),
          ],
        );

        if (!twoColumns) {
          return Column(children: [left, const SizedBox(height: 16), right]);
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 3, child: left),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: right),
          ],
        );
      },
    );
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.item});

  final ContentItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: contentCategoryTint(item.category),
            child: Icon(
              Icons.article_outlined,
              color: contentStatusColor(item.status),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 3),
                Text(
                  '${categoryLabel(item.category)} is ready for review',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          OutlinedButton(
            onPressed: () => context.go('/content/${item.id}'),
            child: const Text('Review'),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert)),
        ],
      ),
    );
  }
}

class _TopContentRow extends StatelessWidget {
  const _TopContentRow({required this.item, required this.index});

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    final views = ['12.4K', '9.8K', '7.6K', '6.3K'][index % 4];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 25,
            backgroundColor: contentCategoryTint(item.category),
            child: Icon(
              Icons.article_outlined,
              color: contentStatusColor(item.status),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                Text(
                  '${compactCategoryLabel(item.category)} - Day ${item.dayOffset + 1}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  const Icon(Icons.visibility_outlined, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    views,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              const Row(
                children: [
                  Icon(Icons.favorite_border, size: 14),
                  SizedBox(width: 4),
                  Text('1.2K'),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
