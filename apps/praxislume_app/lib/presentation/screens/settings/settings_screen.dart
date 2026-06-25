import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Settings',
      subtitle: 'Manage your account, preferences and application settings.',
      currentRoute: '/settings',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SettingsTabs(),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 900;
              final profile = PraxisCard(
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
                    Text('Clinic: ${state.clinic?.name ?? 'No clinic'}'),
                    Text('Phone: ${state.clinic?.phone ?? '-'}'),
                    Text('Language: English (India)'),
                  ],
                ),
              );
              final preferences = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Preferences',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _settingsRow(
                      Icons.camera_alt_outlined,
                      'Default Platform',
                      'Manual export',
                    ),
                    _settingsRow(
                      Icons.article_outlined,
                      'Default Content Type',
                      'Education post',
                    ),
                    _settingsRow(
                      Icons.language_outlined,
                      'Default Language',
                      'English (India)',
                    ),
                    _settingsRow(
                      Icons.tune_outlined,
                      'Default Tone',
                      state.brandKit.tone,
                    ),
                  ],
                ),
              );
              if (!wide) {
                return Column(
                  children: [profile, const SizedBox(height: 16), preferences],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: profile),
                  const SizedBox(width: 16),
                  Expanded(child: preferences),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 900;
              final privacy = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Data & Privacy',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _settingsRow(
                      Icons.download_outlined,
                      'Export My Data',
                      'Manual request',
                    ),
                    _settingsRow(
                      Icons.cleaning_services_outlined,
                      'Clear Cache',
                      'Local only',
                    ),
                    _settingsRow(
                      Icons.privacy_tip_outlined,
                      'Privacy Policy',
                      'MVP safe',
                    ),
                  ],
                ),
              );
              final appearance = PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Appearance',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: const [
                        PraxisChip(
                          label: 'Light',
                          icon: Icons.light_mode_outlined,
                          color: praxisSidebarActive,
                          foreground: praxisPurple,
                        ),
                        PraxisChip(label: 'Medium text'),
                        PraxisChip(
                          label: 'Indigo',
                          color: praxisSoftPurple,
                          foreground: praxisPurple,
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Data and privacy controls are MVP-safe: no patient-identifiable generation data is requested.',
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () {
                        ref.read(praxisProvider.notifier).signOut();
                        context.go('/signin');
                      },
                      child: const Text('Sign out'),
                    ),
                  ],
                ),
              );
              if (!wide) {
                return Column(
                  children: [privacy, const SizedBox(height: 16), appearance],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: privacy),
                  const SizedBox(width: 16),
                  Expanded(child: appearance),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  static Widget _settingsRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: praxisMuted),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _SettingsTabs extends StatelessWidget {
  const _SettingsTabs();

  @override
  Widget build(BuildContext context) {
    const tabs = [
      ('Profile', true),
      ('Preferences', false),
      ('Notifications', false),
      ('Security', false),
      ('Integrations', false),
      ('Billing', false),
      ('Team', false),
    ];
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: praxisLine)),
      ),
      child: Wrap(
        spacing: 26,
        runSpacing: 8,
        children: [
          for (final tab in tabs)
            Container(
              padding: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: tab.$2 ? praxisPurple : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                tab.$1,
                style: TextStyle(
                  color: tab.$2 ? praxisPurple : praxisText,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
