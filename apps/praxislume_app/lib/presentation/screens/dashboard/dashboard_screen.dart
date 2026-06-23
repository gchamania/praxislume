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
                    for (final item in items)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: praxisMint,
                          child: Icon(
                            Icons.article_outlined,
                            color: contentStatusColor(item.status),
                          ),
                        ),
                        title: Text(item.title),
                        subtitle: Text(
                          '${categoryLabel(item.category)} - ${item.status}',
                        ),
                        trailing: OutlinedButton(
                          onPressed: () => context.go('/content/${item.id}'),
                          child: const Text('Review'),
                        ),
                      ),
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
                  const SizedBox(height: 4),
                  const Text(
                    'Deterministic mock metrics until pilot analytics exist.',
                  ),
                  const SizedBox(height: 16),
                  const MiniBarChart(
                    values: [24, 42, 38, 58, 46, 72, 64, 84, 76, 96, 88, 110],
                    height: 154,
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: const [
                      PlatformChip(
                        label: 'Reach estimate',
                        icon: Icons.visibility_outlined,
                      ),
                      PlatformChip(
                        label: 'Manual enquiry notes',
                        icon: Icons.edit_note_outlined,
                      ),
                      PlatformChip(
                        label: 'Analytics engine',
                        icon: Icons.bar_chart_outlined,
                        enabled: false,
                      ),
                    ],
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
              color: praxisPurple.withValues(alpha: 0.06),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
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
