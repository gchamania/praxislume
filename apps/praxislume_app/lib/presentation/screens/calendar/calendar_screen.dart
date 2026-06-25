import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import '../../shared/content_helpers.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Calendar',
      subtitle: 'Plan, review and stay consistent with your content.',
      currentRoute: '/calendar',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Create Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilledButton(
            onPressed: () async =>
                ref.read(praxisProvider.notifier).generateThirtyDayCampaign(),
            child: const Text('Generate 30-day campaign'),
          ),
          const SizedBox(height: 18),
          if (state.campaign == null)
            const EmptyCampaignPanel()
          else
            CampaignReadyPanel(state: state),
        ],
      ),
    );
  }
}

class EmptyCampaignPanel extends StatelessWidget {
  const EmptyCampaignPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'No campaign yet',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text(
            'Generate a deterministic 30-day MVP campaign to populate your calendar.',
          ),
        ],
      ),
    );
  }
}

class CampaignReadyPanel extends StatelessWidget {
  const CampaignReadyPanel({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          state.campaign!.title,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 6),
        Text('Content ideas: ${state.items.length}'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 14,
          runSpacing: 14,
          children: [
            _CampaignMetric(
              icon: Icons.calendar_month_outlined,
              value: '${state.campaign!.durationDays}',
              label: 'Days',
              tint: praxisPurple,
            ),
            _CampaignMetric(
              icon: Icons.article_outlined,
              value: '${state.items.length}',
              label: 'Content Pieces',
              tint: praxisTeal,
            ),
            const _CampaignMetric(
              icon: Icons.movie_creation_outlined,
              value: '12',
              label: 'Reels',
              tint: Color(0xFF2563EB),
            ),
            const _CampaignMetric(
              icon: Icons.image_outlined,
              value: '10',
              label: 'Carousels',
              tint: Color(0xFFF97316),
            ),
          ],
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 1050;
            final calendar = PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const PraxisChip(
                        label: 'Calendar View',
                        icon: Icons.calendar_month_outlined,
                      ),
                      const PraxisChip(
                        label: 'Week View',
                        color: Color(0xFFF3F0FF),
                      ),
                      const PraxisChip(
                        label: 'List View',
                        color: Color(0xFFF3F0FF),
                      ),
                      OutlinedButton(
                        onPressed: () {},
                        child: const Text('All Platforms'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final columns = constraints.maxWidth >= 760 ? 7 : 2;
                      final itemWidth =
                          (constraints.maxWidth - ((columns - 1) * 12)) /
                          columns;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Week 1',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              for (
                                var i = 0;
                                i < state.items.take(14).length;
                                i++
                              )
                                SizedBox(
                                  width: itemWidth,
                                  child: CalendarDayCard(
                                    item: state.items[i],
                                    index: i,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            );
            final summary = CampaignSummaryCard(state: state);
            if (!wide) {
              return Column(
                children: [calendar, const SizedBox(height: 16), summary],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 4, child: calendar),
                const SizedBox(width: 16),
                Expanded(child: summary),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _CampaignMetric extends StatelessWidget {
  const _CampaignMetric({
    required this.icon,
    required this.value,
    required this.label,
    required this.tint,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 210,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: praxisSurface,
        border: Border.all(color: praxisLine),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: praxisInk.withValues(alpha: 0.035),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: tint.withValues(alpha: 0.12),
            foregroundColor: tint,
            child: Icon(icon),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: Theme.of(context).textTheme.titleLarge),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CalendarDayCard extends StatelessWidget {
  const CalendarDayCard({required this.item, required this.index, super.key});

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
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Day ${item.dayOffset + 1}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  PraxisChip(
                    label: categoryLabel(item.category),
                    color: contentCategoryTint(item.category),
                    foreground: contentStatusColor(item.status),
                  ),
                ],
              ),
            ),
            MedicalThumbnail(
              title: item.title.replaceFirst(RegExp(r'^Day \d+: '), ''),
              category: item.category,
              index: index,
              aspectRatio: 1,
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CampaignSummaryCard extends StatelessWidget {
  const CampaignSummaryCard({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Campaign Summary',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _summaryRow(
            Icons.rocket_launch_outlined,
            'Campaign Goal',
            state.campaign!.goal,
          ),
          _summaryRow(
            Icons.health_and_safety_outlined,
            'Specialty Focus',
            state.doctor?.specialty ?? 'Specialty',
          ),
          _summaryRow(
            Icons.topic_outlined,
            'Focus Areas',
            state.clinic?.services.join(', ') ?? 'Services',
          ),
          _summaryRow(
            Icons.calendar_month_outlined,
            'Start Date',
            formatShortDate(state.campaign!.startDate),
          ),
          _summaryRow(
            Icons.fact_check_outlined,
            'Posting Frequency',
            '1 item per day',
          ),
          const SizedBox(height: 12),
          PraxisCard(
            color: const Color(0xFFFFF8E8),
            child: Text(
              'All content remains review/export only. No social publishing is enabled in MVP.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: praxisPurple.withValues(alpha: 0.08),
            foregroundColor: praxisPurple,
            child: Icon(icon, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: praxisMuted, fontSize: 12),
                ),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
