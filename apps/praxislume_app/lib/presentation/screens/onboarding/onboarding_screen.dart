import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import '../auth/auth_widgets.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _doctorName = TextEditingController();
  final _qualifications = TextEditingController();
  final _specialty = TextEditingController();
  final _clinicName = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController();
  final _services = TextEditingController();
  final _phone = TextEditingController();

  @override
  void dispose() {
    _doctorName.dispose();
    _qualifications.dispose();
    _specialty.dispose();
    _clinicName.dispose();
    _locality.dispose();
    _city.dispose();
    _services.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 980;
    final form = Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisChip(label: 'Step 1 of 7', color: praxisMint),
          const SizedBox(height: 24),
          Text(
            'Doctor and clinic profile',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'This single MVP step captures the details needed to generate specialty-aware campaigns.',
          ),
          const SizedBox(height: 24),
          PraxisCard(
            child: Column(
              children: [
                _field(
                  _doctorName,
                  'Doctor name',
                  const Key('doctorNameField'),
                  icon: Icons.person_outline,
                  requiredMessage: 'Doctor name is required',
                ),
                _field(
                  _qualifications,
                  'Qualifications',
                  const Key('qualificationsField'),
                  icon: Icons.workspace_premium_outlined,
                ),
                _field(
                  _specialty,
                  'Specialty',
                  const Key('specialtyField'),
                  icon: Icons.medical_services_outlined,
                ),
                _field(
                  _clinicName,
                  'Clinic name',
                  const Key('clinicNameField'),
                  icon: Icons.local_hospital_outlined,
                ),
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        _locality,
                        'Locality',
                        const Key('localityField'),
                        icon: Icons.place_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        _city,
                        'City',
                        const Key('cityField'),
                        icon: Icons.location_city_outlined,
                      ),
                    ),
                  ],
                ),
                _field(
                  _services,
                  'Clinic services',
                  const Key('servicesField'),
                  icon: Icons.medical_services_outlined,
                  helper:
                      'Separate services with commas, e.g. sinus consultation, ear infection care.',
                ),
                _field(
                  _phone,
                  'Phone or WhatsApp',
                  const Key('phoneField'),
                  icon: Icons.phone_outlined,
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return Scaffold(
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: EdgeInsets.fromLTRB(
            compact ? 16 : 28,
            14,
            compact ? 16 : 28,
            14,
          ),
          decoration: const BoxDecoration(
            color: praxisSurface,
            border: Border(top: BorderSide(color: praxisLine)),
          ),
          child: compact
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    FilledButton.icon(
                      onPressed: _submit,
                      iconAlignment: IconAlignment.end,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('Complete onboarding'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Back'),
                    ),
                  ],
                )
              : Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Back'),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {},
                      child: const Text('Skip for now'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: _submit,
                      iconAlignment: IconAlignment.end,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('Complete onboarding'),
                    ),
                  ],
                ),
        ),
      ),
      body: SafeArea(
        child: Row(
          children: [
            if (!compact) const OnboardingRail(),
            Expanded(
              child: ListView(
                padding: EdgeInsets.fromLTRB(
                  compact ? 20 : 34,
                  compact ? 20 : 34,
                  compact ? 20 : 34,
                  110,
                ),
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () => context.go('/signin'),
                      icon: const Icon(Icons.close),
                      label: const Text('Exit Onboarding'),
                    ),
                  ),
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1120),
                      child: compact
                          ? form
                          : Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(flex: 2, child: form),
                                const SizedBox(width: 28),
                                const Expanded(child: OnboardingPreview()),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    await ref
        .read(praxisProvider.notifier)
        .completeOnboarding(
          doctorName: _doctorName.text.trim(),
          qualifications: _qualifications.text.trim(),
          specialty: _specialty.text.trim(),
          clinicName: _clinicName.text.trim(),
          locality: _locality.text.trim(),
          city: _city.text.trim(),
          services: _services.text
              .split(',')
              .map((service) => service.trim())
              .where((service) => service.isNotEmpty)
              .toList(),
          phone: _phone.text.trim(),
        );
    if (!mounted) {
      return;
    }
    context.go('/dashboard');
  }

  Widget _field(
    TextEditingController controller,
    String label,
    Key key, {
    required IconData icon,
    String? requiredMessage,
    String? helper,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        key: key,
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          prefixIcon: Icon(icon),
        ),
        validator: (value) {
          if ((value ?? '').trim().isEmpty) {
            return requiredMessage ?? '$label is required';
          }
          return null;
        },
      ),
    );
  }
}

class OnboardingRail extends StatelessWidget {
  const OnboardingRail({super.key});

  @override
  Widget build(BuildContext context) {
    const steps = [
      ('Choose Specialty', Icons.medical_services_outlined),
      ('Clinic Details', Icons.local_hospital_outlined),
      ('Doctor Profile', Icons.person_outline),
      ('Brand Identity', Icons.palette_outlined),
      ('Content Goals', Icons.track_changes_outlined),
      ('Preferred Platforms', Icons.devices_outlined),
      ("You're All Set!", Icons.check_circle_outline),
    ];
    return Container(
      width: 270,
      padding: const EdgeInsets.fromLTRB(28, 30, 20, 24),
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(right: BorderSide(color: praxisLine)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 70),
          Text(
            'Welcome to PraxisLume',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text('Set up your practice in a few focused steps.'),
          const SizedBox(height: 28),
          for (var i = 0; i < steps.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: i == 0 ? praxisTeal : praxisSurface,
                    foregroundColor: i == 0 ? Colors.white : praxisText,
                    child: i == 0
                        ? const Text(
                            '1',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          )
                        : Text('${i + 1}'),
                  ),
                  const SizedBox(width: 12),
                  Icon(steps[i].$2, color: i == 0 ? praxisTeal : praxisMuted),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      steps[i].$1,
                      style: TextStyle(
                        color: i == 0 ? praxisTealDark : praxisText,
                        fontWeight: i == 0 ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const Spacer(),
          const SecurityNotice(),
        ],
      ),
    );
  }
}

class OnboardingPreview extends StatelessWidget {
  const OnboardingPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PraxisCard(
          color: praxisMint.withValues(alpha: 0.7),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.assignment_turned_in_outlined, size: 72),
              const SizedBox(height: 24),
              Text(
                'Why this matters',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 18),
              const _PreviewReason(
                icon: Icons.track_changes,
                text: 'Relevant ideas based on specialty and services.',
              ),
              const _PreviewReason(
                icon: Icons.groups_2_outlined,
                text: 'Patient-friendly education without diagnosis claims.',
              ),
              const _PreviewReason(
                icon: Icons.trending_up,
                text: 'A consistent foundation for campaign growth.',
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        PraxisCard(
          child: Text(
            'The content ideas are so relevant to my practice. It saves me hours every week.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
      ],
    );
  }
}

class _PreviewReason extends StatelessWidget {
  const _PreviewReason({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: praxisSurface,
            foregroundColor: praxisTealDark,
            child: Icon(icon),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
