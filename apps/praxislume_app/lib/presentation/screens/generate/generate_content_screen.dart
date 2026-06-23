import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import '../library/content_library_screen.dart';

class GenerateContentScreen extends ConsumerWidget {
  const GenerateContentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Content Conveyor Belt',
      subtitle: 'Input a topic. Get a safe content package ready for review.',
      currentRoute: '/generate',
      primaryAction: FilledButton.icon(
        onPressed: () async {
          await ref.read(praxisProvider.notifier).generateThirtyDayCampaign();
          if (context.mounted) {
            context.go('/calendar');
          }
        },
        icon: const Icon(Icons.auto_awesome),
        label: const Text('Generate Content'),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 980;
          final input = _GenerateInputPanel(state: state);
          final output = _GeneratedPackagePanel(state: state);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PraxisCard(
                child: _GenerateSteps(compact: constraints.maxWidth < 620),
              ),
              const SizedBox(height: 18),
              if (wide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 410, child: input),
                    const SizedBox(width: 18),
                    Expanded(child: output),
                  ],
                )
              else
                Column(children: [input, const SizedBox(height: 18), output]),
            ],
          );
        },
      ),
    );
  }
}

class _StepPill extends StatelessWidget {
  const _StepPill({
    required this.number,
    required this.title,
    required this.text,
  });

  final String number;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          backgroundColor: number == '1' ? praxisPurple : praxisMint,
          foregroundColor: number == '1' ? Colors.white : praxisTealDark,
          child: Text(
            number,
            style: const TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              Text(text, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _GenerateSteps extends StatelessWidget {
  const _GenerateSteps({required this.compact});

  final bool compact;

  static const _steps = [
    _StepPill(number: '1', title: 'Topic', text: 'Tell us what to create'),
    _StepPill(number: '2', title: 'Generate', text: 'Draft the package'),
    _StepPill(number: '3', title: 'Review', text: 'Customize and approve'),
    _StepPill(number: '4', title: 'Export', text: 'Manual copy only'),
  ];

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          for (final step in _steps) SizedBox(width: 138, child: step),
        ],
      );
    }

    return Row(
      children: const [
        Expanded(
          child: _StepPill(
            number: '1',
            title: 'Topic',
            text: 'Tell us what to create',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '2',
            title: 'Generate',
            text: 'Draft the package',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '3',
            title: 'Review',
            text: 'Customize and approve',
          ),
        ),
        Expanded(child: Divider()),
        Expanded(
          child: _StepPill(
            number: '4',
            title: 'Export',
            text: 'Manual copy only',
          ),
        ),
      ],
    );
  }
}

class _GenerateInputPanel extends ConsumerWidget {
  const _GenerateInputPanel({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisChip(
            label: 'Tell us about your content',
            icon: Icons.edit,
          ),
          const SizedBox(height: 18),
          _ReadonlySelect(
            label: 'Specialty',
            value: state.doctor?.specialty ?? 'ENT',
            icon: Icons.medical_services_outlined,
          ),
          _ReadonlySelect(
            label: 'Topic / Condition',
            value: state.clinic?.services.firstOrNull ?? 'Sinus consultation',
            icon: Icons.topic_outlined,
          ),
          const _ReadonlySelect(
            label: 'Content Type',
            value: '30-day campaign package',
            icon: Icons.calendar_month_outlined,
          ),
          const _ReadonlySelect(
            label: 'Audience',
            value: 'Patients',
            icon: Icons.groups_2_outlined,
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: () async {
              await ref
                  .read(praxisProvider.notifier)
                  .generateThirtyDayCampaign();
              if (context.mounted) {
                context.go('/calendar');
              }
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate Content'),
          ),
          const SizedBox(height: 10),
          Text(
            'Estimated time: instant fake provider for MVP smoke tests.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ReadonlySelect extends StatelessWidget {
  const _ReadonlySelect({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: praxisSurface,
              border: Border.all(color: praxisLine),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(icon, color: praxisPurple),
                const SizedBox(width: 10),
                Expanded(child: Text(value)),
                const Icon(Icons.keyboard_arrow_down, color: praxisMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GeneratedPackagePanel extends StatelessWidget {
  const _GeneratedPackagePanel({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final sample = state.items.take(3).toList();
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const PraxisChip(
                label: 'Review package',
                icon: Icons.check_circle,
              ),
              OutlinedButton.icon(
                onPressed: () => context.go('/calendar'),
                icon: const Icon(Icons.calendar_month_outlined),
                label: const Text('Open Calendar'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: const [
              _PackageTile(
                icon: Icons.movie_creation_outlined,
                label: 'Reel Script',
              ),
              _PackageTile(icon: Icons.image_outlined, label: 'Thumbnail'),
              _PackageTile(icon: Icons.notes_outlined, label: 'Caption'),
              _PackageTile(icon: Icons.tag, label: 'Hashtags'),
              _PackageTile(icon: Icons.campaign_outlined, label: 'CTA'),
            ],
          ),
          const SizedBox(height: 20),
          if (sample.isEmpty)
            const Text('Generate a campaign to fill this package.')
          else
            for (var i = 0; i < sample.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ContentMiniCard(item: sample[i], index: i),
              ),
        ],
      ),
    );
  }
}

class _PackageTile extends StatelessWidget {
  const _PackageTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 124,
      child: PraxisCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: praxisPurple),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center),
            const SizedBox(height: 5),
            const Text(
              'Ready',
              style: TextStyle(color: Color(0xFF009E73), fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
