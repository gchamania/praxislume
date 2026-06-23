import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../shared/content_helpers.dart';
import '../../state/praxis_providers.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  String _platform = 'All platforms';
  String _type = 'All types';
  String _topic = 'All topics';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Calendar',
      subtitle:
          'Plan, review and stay consistent. Publishing remains manual/export only.',
      currentRoute: '/calendar',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Create Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.campaign == null)
            EmptyCampaignPanel(
              onGenerate: () async {
                await ref
                    .read(praxisProvider.notifier)
                    .generateThirtyDayCampaign();
                if (context.mounted) {
                  context.go('/campaign-ready');
                }
              },
            )
          else
            CampaignReadyPanel(
              state: state,
              platform: _platform,
              type: _type,
              topic: _topic,
              onPlatform: (value) => setState(() => _platform = value),
              onType: (value) => setState(() => _type = value),
              onTopic: (value) => setState(() => _topic = value),
            ),
        ],
      ),
    );
  }
}

class EmptyCampaignPanel extends StatelessWidget {
  const EmptyCampaignPanel({this.onGenerate, super.key});

  final VoidCallback? onGenerate;

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
            'Generate a deterministic 30-day MVP campaign to populate your review calendar.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onGenerate ?? () => context.go('/generate'),
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate 30-day campaign'),
          ),
        ],
      ),
    );
  }
}

class CampaignReadyPanel extends StatelessWidget {
  const CampaignReadyPanel({
    required this.state,
    required this.platform,
    required this.type,
    required this.topic,
    required this.onPlatform,
    required this.onType,
    required this.onTopic,
    super.key,
  });

  final PraxisState state;
  final String platform;
  final String type;
  final String topic;
  final ValueChanged<String> onPlatform;
  final ValueChanged<String> onType;
  final ValueChanged<String> onTopic;

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (items.isNotEmpty) ...[
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              key: const Key('reviewFirstContentButton'),
              onPressed: () => context.go('/content/${items.first.id}'),
              icon: const Icon(Icons.rate_review_outlined),
              label: const Text('Review Day 1'),
            ),
          ),
          const SizedBox(height: 12),
        ],
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 960
                ? 4
                : constraints.maxWidth >= 620
                ? 2
                : 1;
            final width = (constraints.maxWidth - (columns - 1) * 12) / columns;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                SizedBox(
                  width: width,
                  child: PrototypeMetricCard(
                    label: 'Content ideas',
                    value: '${state.items.length}',
                    icon: Icons.article_outlined,
                    tint: praxisPurple,
                    note: 'Review',
                  ),
                ),
                SizedBox(
                  width: width,
                  child: PrototypeMetricCard(
                    label: 'Manual export',
                    value: 'On',
                    icon: Icons.copy_outlined,
                    tint: praxisTeal,
                  ),
                ),
                SizedBox(
                  width: width,
                  child: PrototypeMetricCard(
                    label: 'Publishing',
                    value: 'Off',
                    icon: Icons.lock_clock_outlined,
                    tint: praxisGold,
                  ),
                ),
                SizedBox(
                  width: width,
                  child: PrototypeMetricCard(
                    label: 'Duration',
                    value: '${state.campaign!.durationDays}d',
                    icon: Icons.calendar_month_outlined,
                    tint: const Color(0xFF2E79FF),
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 18),
        LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 1080;
            final schedule = PraxisCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  PrototypeSectionHeader(
                    title: state.campaign!.title,
                    subtitle: 'Content ideas: ${state.items.length}',
                    trailing: OutlinedButton.icon(
                      onPressed: () => context.go('/campaign-ready'),
                      icon: const Icon(Icons.fact_check_outlined),
                      label: const Text('Review package'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _CalendarFilters(
                    platform: platform,
                    type: type,
                    topic: topic,
                    onPlatform: onPlatform,
                    onType: onType,
                    onTopic: onTopic,
                  ),
                  if (items.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            context.go('/content/${items.first.id}'),
                        icon: const Icon(Icons.rate_review_outlined),
                        label: const Text('Review Day 1'),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _WeeklySchedule(items: items),
                ],
              ),
            );
            final summary = CampaignSummaryCard(state: state);
            if (!wide) {
              return Column(
                children: [schedule, const SizedBox(height: 16), summary],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 4, child: schedule),
                const SizedBox(width: 16),
                Expanded(flex: 2, child: summary),
              ],
            );
          },
        ),
      ],
    );
  }

  List<ContentItem> _filteredItems() {
    return state.items.where((item) {
      final typeMatches =
          type == 'All types' || categoryLabel(item.category) == type;
      final topicMatches =
          topic == 'All topics' ||
          item.title.toLowerCase().contains(topic.toLowerCase());
      return typeMatches && topicMatches;
    }).toList();
  }
}

class _CalendarFilters extends StatelessWidget {
  const _CalendarFilters({
    required this.platform,
    required this.type,
    required this.topic,
    required this.onPlatform,
    required this.onType,
    required this.onTopic,
  });

  final String platform;
  final String type;
  final String topic;
  final ValueChanged<String> onPlatform;
  final ValueChanged<String> onType;
  final ValueChanged<String> onTopic;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final value in const [
          'All platforms',
          'Instagram',
          'WhatsApp',
          'Google Business',
        ])
          FilterPill(
            label: value,
            active: platform == value,
            icon: Icons.devices_outlined,
            onTap: () => onPlatform(value),
          ),
        for (final value in const [
          'All types',
          'Awareness',
          'Myth-buster',
          'Symptoms',
          'FAQ',
        ])
          FilterPill(
            label: value,
            active: type == value,
            icon: Icons.filter_list,
            onTap: () => onType(value),
          ),
        for (final value in const ['All topics', 'Sinus', 'Acne', 'Care'])
          FilterPill(
            label: value,
            active: topic == value,
            icon: Icons.topic_outlined,
            onTap: () => onTopic(value),
          ),
      ],
    );
  }
}

class _WeeklySchedule extends StatelessWidget {
  const _WeeklySchedule({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    final weeks = <List<ContentItem>>[];
    for (var i = 0; i < items.length; i += 7) {
      weeks.add(items.skip(i).take(7).toList());
    }
    return Column(
      children: [
        if (weeks.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Text('No content matches the current filters.'),
          )
        else
          for (var weekIndex = 0; weekIndex < weeks.take(4).length; weekIndex++)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _WeekRow(weekIndex: weekIndex, items: weeks[weekIndex]),
            ),
      ],
    );
  }
}

class _WeekRow extends StatelessWidget {
  const _WeekRow({required this.weekIndex, required this.items});

  final int weekIndex;
  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Week ${weekIndex + 1}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 880
                ? 7
                : constraints.maxWidth >= 560
                ? 3
                : 1;
            final width = (constraints.maxWidth - (columns - 1) * 10) / columns;
            return Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (var i = 0; i < days.length; i++)
                  SizedBox(
                    width: width,
                    child: CalendarDayCard(
                      item: i < items.length ? items[i] : null,
                      index: weekIndex * 7 + i,
                      dayLabel: days[i],
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class CalendarDayCard extends StatelessWidget {
  const CalendarDayCard({
    required this.item,
    required this.index,
    required this.dayLabel,
    super.key,
  });

  final ContentItem? item;
  final int index;
  final String dayLabel;

  @override
  Widget build(BuildContext context) {
    final content = item;
    return InkWell(
      onTap: content == null
          ? null
          : () => context.go('/content/${content.id}'),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        constraints: const BoxConstraints(minHeight: 178),
        decoration: BoxDecoration(
          color: content == null ? praxisCanvas : praxisSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: praxisLine),
        ),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    dayLabel,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const Spacer(),
                  if (content != null)
                    StatusBadge(label: 'Day ${content.dayOffset + 1}')
                  else
                    const StatusBadge(
                      label: 'Buffer',
                      color: Color(0xFFF3F5F9),
                      foreground: praxisMuted,
                    ),
                ],
              ),
              const SizedBox(height: 10),
              if (content == null)
                const Expanded(
                  child: Center(
                    child: Text(
                      'No content',
                      style: TextStyle(color: praxisMuted),
                    ),
                  ),
                )
              else ...[
                MedicalThumbnail(
                  title: content.title.replaceFirst(RegExp(r'^Day \d+: '), ''),
                  category: content.category,
                  index: index,
                  aspectRatio: 1.3,
                ),
                const SizedBox(height: 10),
                Text(
                  content.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                StatusBadge(
                  label: categoryLabel(content.category),
                  color: contentCategoryTint(content.category),
                  foreground: contentStatusColor(content.status),
                ),
              ],
            ],
          ),
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
            'Posting Frequency',
            '1 review item per day',
          ),
          const SizedBox(height: 12),
          const PreviewOnlyBanner(
            message:
                'This is a planning calendar only. No social scheduling or publishing is active.',
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
