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
        children: [
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
          PraxisCard(
            child: Row(
              children: [
                const Icon(Icons.privacy_tip_outlined, color: praxisPurple),
                const SizedBox(width: 14),
                const Expanded(
                  child: Text(
                    'Data and privacy controls are MVP-safe: no patient-identifiable generation data is requested.',
                  ),
                ),
                OutlinedButton(
                  onPressed: () {
                    ref.read(praxisProvider.notifier).signOut();
                    context.go('/signin');
                  },
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingsRow(IconData icon, String label, String value) {
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
