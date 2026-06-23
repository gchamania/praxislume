import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../shared/content_helpers.dart';
import '../../state/praxis_providers.dart';
import '../library/content_library_screen.dart';

class CampaignReadyScreen extends ConsumerStatefulWidget {
  const CampaignReadyScreen({super.key});

  @override
  ConsumerState<CampaignReadyScreen> createState() =>
      _CampaignReadyScreenState();
}

class _CampaignReadyScreenState extends ConsumerState<CampaignReadyScreen> {
  String _tab = 'Calendar';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    if (state.campaign == null) {
      return WorkspaceShell(
        title: 'Campaign Ready',
        subtitle: 'Generate a campaign before review.',
        currentRoute: '/generate',
        child: PraxisCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'No campaign package is ready yet.',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text('Create a package from Generate Content first.'),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => context.go('/generate'),
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Generate Content'),
              ),
            ],
          ),
        ),
      );
    }

    return WorkspaceShell(
      title: 'Campaign Ready',
      subtitle:
          'Review the generated 30-day package before adding it to the calendar.',
      currentRoute: '/generate',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/calendar'),
        icon: const Icon(Icons.check_circle_outline),
        label: const Text('Approve & Add to Calendar'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              key: const Key('approveCampaignButton'),
              onPressed: () => context.go('/calendar'),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Approve & Add to Calendar'),
            ),
          ),
          const SizedBox(height: 18),
          _Hero(state: state),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 1040;
              final review = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    PrototypeSectionHeader(
                      title: state.campaign!.title,
                      subtitle: 'Content ideas: ${state.items.length}',
                      trailing: PrototypeTabStrip(
                        tabs: const ['Calendar', 'List', 'Week'],
                        selected: _tab,
                        onSelected: (value) => setState(() => _tab = value),
                      ),
                    ),
                    const SizedBox(height: 18),
                    _tabBody(state),
                  ],
                ),
              );
              final summary = _CampaignSummaryPanel(state: state);
              if (!wide) {
                return Column(
                  children: [review, const SizedBox(height: 16), summary],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 4, child: review),
                  const SizedBox(width: 16),
                  Expanded(flex: 2, child: summary),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _tabBody(PraxisState state) {
    final items = state.items.take(_tab == 'List' ? 8 : 14).toList();
    if (_tab == 'List') {
      return Column(
        children: [
          for (var i = 0; i < items.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ContentMiniCard(item: items[i], index: i),
            ),
        ],
      );
    }
    if (_tab == 'Week') {
      return _WeekPreview(items: items);
    }
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (var i = 0; i < items.length; i++)
          SizedBox(
            width: 150,
            child: _ReadyDayCard(item: items[i], index: i),
          ),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 960
            ? 4
            : constraints.maxWidth >= 620
            ? 2
            : 1;
        final width = (constraints.maxWidth - (columns - 1) * 12) / columns;
        final drafted = state.items.where((item) => item.status == 'drafted');
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: width,
              child: PrototypeMetricCard(
                label: 'Generated items',
                value: '${state.items.length}',
                icon: Icons.auto_awesome,
                tint: praxisPurple,
                note: 'fake/provider',
              ),
            ),
            SizedBox(
              width: width,
              child: PrototypeMetricCard(
                label: 'Campaign days',
                value: '${state.campaign!.durationDays}',
                icon: Icons.calendar_month_outlined,
                tint: praxisTeal,
              ),
            ),
            SizedBox(
              width: width,
              child: PrototypeMetricCard(
                label: 'Specialty focus',
                value: state.doctor?.specialty ?? 'Specialty',
                icon: Icons.health_and_safety_outlined,
                tint: praxisGold,
              ),
            ),
            SizedBox(
              width: width,
              child: PrototypeMetricCard(
                label: 'Needs doctor review',
                value: '${state.items.length - drafted.length}',
                icon: Icons.fact_check_outlined,
                tint: const Color(0xFF2E79FF),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CampaignSummaryPanel extends StatelessWidget {
  const _CampaignSummaryPanel({required this.state});

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
          const SizedBox(height: 14),
          _summaryRow(
            Icons.rocket_launch_outlined,
            'Goal',
            state.campaign!.goal,
          ),
          _summaryRow(
            Icons.local_hospital_outlined,
            'Clinic',
            state.clinic?.name ?? 'Clinic',
          ),
          _summaryRow(
            Icons.medical_services_outlined,
            'Specialty',
            state.doctor?.specialty ?? 'Specialty',
          ),
          _summaryRow(
            Icons.topic_outlined,
            'Focus areas',
            state.clinic?.services.join(', ') ?? 'Services',
          ),
          const SizedBox(height: 8),
          const PreviewOnlyBanner(
            message:
                'Approval saves this reviewed package to the visible calendar only. No publishing or scheduler integration is enabled.',
            icon: Icons.lock_clock_outlined,
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.drafts_outlined),
              label: const Text('Save as Draft'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => context.go('/calendar'),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Approve & Add to Calendar'),
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

class _ReadyDayCard extends StatelessWidget {
  const _ReadyDayCard({required this.item, required this.index});

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
            MedicalThumbnail(
              title: item.title.replaceFirst(RegExp(r'^Day \d+: '), ''),
              category: item.category,
              index: index,
              aspectRatio: 1.1,
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Day ${item.dayOffset + 1}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  StatusBadge(
                    label: categoryLabel(item.category),
                    color: contentCategoryTint(item.category),
                    foreground: contentStatusColor(item.status),
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

class _WeekPreview extends StatelessWidget {
  const _WeekPreview({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Column(
      children: [
        for (var i = 0; i < days.length; i++)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: i.isEven ? praxisCanvas : praxisSurface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: praxisLine),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 54,
                  child: Text(
                    days[i],
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    i < items.length
                        ? items[i].title
                        : 'Review buffer, no publishing scheduled',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                StatusBadge(
                  label: i < items.length ? 'Review' : 'Buffer',
                  color: i < items.length
                      ? praxisMint
                      : const Color(0xFFF3F5F9),
                  foreground: i < items.length ? praxisTealDark : praxisMuted,
                ),
              ],
            ),
          ),
      ],
    );
  }
}
