import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  String _tab = 'Profile';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Settings',
      subtitle:
          'Manage profile, preferences, security and MVP-safe boundaries.',
      currentRoute: '/settings',
      child: Column(
        children: [
          PraxisCard(
            child: PrototypeTabStrip(
              tabs: const [
                'Profile',
                'Preferences',
                'Security',
                'Privacy',
                'Appearance',
              ],
              selected: _tab,
              onSelected: (value) => setState(() => _tab = value),
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 900;
              final left = _ProfilePanel(state: state);
              final right = _SettingsDetailPanel(tab: _tab, state: state);
              if (!wide) {
                return Column(
                  children: [left, const SizedBox(height: 16), right],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: left),
                  const SizedBox(width: 16),
                  Expanded(child: right),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          PraxisCard(
            child: Row(
              children: [
                const Icon(Icons.privacy_tip_outlined, color: praxisPurple),
                const SizedBox(width: 14),
                const Expanded(
                  child: Text(
                    'No patient-identifiable prompt fields, social integrations, CRM workflows, or publishing automations are active in this MVP.',
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    ref.read(praxisProvider.notifier).signOut();
                    context.go('/signin');
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfilePanel extends StatelessWidget {
  const _ProfilePanel({required this.state});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Profile Information',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const CircleAvatar(
                radius: 36,
                backgroundColor: praxisMint,
                child: Icon(Icons.person, color: praxisTealDark),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.doctor?.name ?? 'Doctor',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(state.doctor?.specialty ?? 'Specialty'),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 30),
          _settingsRow(
            Icons.local_hospital_outlined,
            'Clinic',
            state.clinic?.name ?? 'No clinic',
          ),
          _settingsRow(
            Icons.phone_outlined,
            'Phone',
            state.clinic?.phone ?? '-',
          ),
          _settingsRow(
            Icons.place_outlined,
            'Locality',
            state.clinic?.locality ?? '-',
          ),
          _settingsRow(Icons.language_outlined, 'Language', 'English (India)'),
        ],
      ),
    );
  }
}

class _SettingsDetailPanel extends StatelessWidget {
  const _SettingsDetailPanel({required this.tab, required this.state});

  final String tab;
  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final rows = switch (tab) {
      'Preferences' => [
        (Icons.camera_alt_outlined, 'Default Platform', 'Manual export'),
        (Icons.article_outlined, 'Default Content Type', 'Education post'),
        (Icons.tune_outlined, 'Default Tone', state.brandKit.tone),
        (Icons.campaign_outlined, 'Default CTA', state.brandKit.defaultCta),
      ],
      'Security' => const [
        (Icons.verified_user_outlined, 'Authentication', 'Supabase Auth'),
        (Icons.security_outlined, 'Tenant isolation', 'Supabase RLS'),
        (Icons.key_off_outlined, 'Provider keys', 'Server only'),
        (Icons.password_outlined, 'Password reset', 'Deferred'),
      ],
      'Privacy' => const [
        (Icons.privacy_tip_outlined, 'Patient data prompts', 'Blocked'),
        (Icons.receipt_long_outlined, 'AI audit logs', 'Required'),
        (Icons.medical_information_outlined, 'Medical advice', 'Not provided'),
        (Icons.fact_check_outlined, 'Doctor approval', 'Required'),
      ],
      'Appearance' => [
        (Icons.palette_outlined, 'Primary color', state.brandKit.primaryColor),
        (
          Icons.format_color_fill_outlined,
          'Secondary color',
          state.brandKit.secondaryColor,
        ),
        (
          Icons.auto_fix_high_outlined,
          'Accent color',
          state.brandKit.accentColor,
        ),
        (Icons.web_asset_outlined, 'Theme', 'Clinical light'),
      ],
      _ => [
        (Icons.person_outline, 'Doctor', state.doctor?.name ?? 'Doctor'),
        (
          Icons.workspace_premium_outlined,
          'Qualifications',
          state.doctor?.qualifications ?? '-',
        ),
        (
          Icons.medical_services_outlined,
          'Specialty',
          state.doctor?.specialty ?? '-',
        ),
        (Icons.local_hospital_outlined, 'Clinic', state.clinic?.name ?? '-'),
      ],
    };
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tab, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          for (final row in rows) _settingsRow(row.$1, row.$2, row.$3),
          if (tab == 'Security' || tab == 'Privacy') ...[
            const SizedBox(height: 8),
            const PreviewOnlyBanner(
              message:
                  'Advanced admin controls are deferred. The MVP relies on Supabase Auth, RLS, and backend-only provider secrets.',
            ),
          ],
        ],
      ),
    );
  }
}

Widget _settingsRow(IconData icon, String label, String value) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(
      children: [
        Icon(icon, color: praxisMuted),
        const SizedBox(width: 12),
        Expanded(child: Text(label)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );
}
