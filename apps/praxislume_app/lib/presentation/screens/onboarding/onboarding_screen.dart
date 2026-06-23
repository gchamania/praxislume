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
  final _stepKeys = List.generate(4, (_) => GlobalKey<FormState>());
  final _doctorName = TextEditingController();
  final _qualifications = TextEditingController();
  final _specialty = TextEditingController();
  final _clinicName = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController();
  final _services = TextEditingController();
  final _phone = TextEditingController();
  late final TextEditingController _primaryColor;
  late final TextEditingController _cta;
  late final TextEditingController _disclaimer;
  int _step = 0;
  String _tone = 'warm';
  String _goal = 'Appointments';
  final Set<String> _platforms = {'Instagram', 'WhatsApp'};

  static const _steps = [
    _OnboardingStep(
      title: 'Specialty and focus areas',
      eyebrow: 'Step 1 of 7',
      icon: Icons.medical_services_outlined,
    ),
    _OnboardingStep(
      title: 'Clinic details',
      eyebrow: 'Step 2 of 7',
      icon: Icons.local_hospital_outlined,
    ),
    _OnboardingStep(
      title: 'Doctor profile',
      eyebrow: 'Step 3 of 7',
      icon: Icons.person_outline,
    ),
    _OnboardingStep(
      title: 'Brand identity basics',
      eyebrow: 'Step 4 of 7',
      icon: Icons.palette_outlined,
    ),
    _OnboardingStep(
      title: 'Content goals and platforms',
      eyebrow: 'Step 5 of 7',
      icon: Icons.track_changes_outlined,
    ),
    _OnboardingStep(
      title: 'Review handoff',
      eyebrow: 'Step 6 of 7',
      icon: Icons.fact_check_outlined,
    ),
    _OnboardingStep(
      title: 'Ready to launch',
      eyebrow: 'Step 7 of 7',
      icon: Icons.check_circle_outline,
    ),
  ];

  @override
  void initState() {
    super.initState();
    final brand = ref.read(praxisProvider).brandKit;
    _primaryColor = TextEditingController(text: brand.primaryColor);
    _cta = TextEditingController(text: brand.defaultCta);
    _disclaimer = TextEditingController(text: brand.disclaimer);
  }

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
    _primaryColor.dispose();
    _cta.dispose();
    _disclaimer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 980;
    final current = _steps[_step];
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
          child: Wrap(
            spacing: 12,
            runSpacing: 10,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: _step == 0
                    ? () => context.go('/signin')
                    : () => setState(() => _step -= 1),
                icon: Icon(_step == 0 ? Icons.arrow_back : Icons.chevron_left),
                label: Text(_step == 0 ? 'Back' : 'Previous'),
              ),
              Text(
                current.eyebrow,
                style: const TextStyle(
                  color: praxisMuted,
                  fontWeight: FontWeight.w800,
                ),
              ),
              FilledButton.icon(
                onPressed: _step == _steps.length - 1 ? _submit : _next,
                iconAlignment: IconAlignment.end,
                icon: Icon(
                  _step == _steps.length - 1
                      ? Icons.check_circle_outline
                      : Icons.arrow_forward,
                ),
                label: Text(
                  _step == _steps.length - 1 ? 'Complete onboarding' : 'Next',
                ),
              ),
            ],
          ),
        ),
      ),
      body: SafeArea(
        child: Row(
          children: [
            if (!compact) _OnboardingRail(currentStep: _step, steps: _steps),
            Expanded(
              child: ListView(
                padding: EdgeInsets.fromLTRB(
                  compact ? 20 : 34,
                  compact ? 20 : 30,
                  compact ? 20 : 34,
                  118,
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
                      constraints: const BoxConstraints(maxWidth: 1160),
                      child: compact
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _stepContent(current),
                                const SizedBox(height: 18),
                                _OnboardingPreview(
                                  step: _step,
                                  clinicName: _clinicName.text,
                                  specialty: _specialty.text,
                                  services: _services.text,
                                  primaryColor: _primaryColor.text,
                                  cta: _cta.text,
                                ),
                              ],
                            )
                          : Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(flex: 3, child: _stepContent(current)),
                                const SizedBox(width: 28),
                                Expanded(
                                  flex: 2,
                                  child: _OnboardingPreview(
                                    step: _step,
                                    clinicName: _clinicName.text,
                                    specialty: _specialty.text,
                                    services: _services.text,
                                    primaryColor: _primaryColor.text,
                                    cta: _cta.text,
                                  ),
                                ),
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

  Widget _stepContent(_OnboardingStep current) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        StatusBadge(label: current.eyebrow, icon: current.icon),
        const SizedBox(height: 18),
        Text(current.title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(_subtitleForStep(_step)),
        const SizedBox(height: 22),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: KeyedSubtree(
            key: ValueKey(_step),
            child: switch (_step) {
              0 => _specialtyStep(),
              1 => _clinicStep(),
              2 => _doctorStep(),
              3 => _brandStep(),
              4 => _goalsStep(),
              5 => _reviewStep(),
              _ => _completeStep(),
            },
          ),
        ),
      ],
    );
  }

  String _subtitleForStep(int step) {
    return switch (step) {
      0 => 'Choose the clinical context that will shape topic generation.',
      1 => 'Add the clinic identity and contact basics used in CTAs.',
      2 => 'Give the campaign the right doctor voice and credentials.',
      3 => 'Set the brand defaults applied to new generated content.',
      4 => 'Select local content intent. Platform controls are visual only.',
      5 => 'Review the MVP-safe fields before generating campaigns.',
      _ => 'Your clinic workspace is ready for the 30-day campaign flow.',
    };
  }

  Widget _specialtyStep() {
    return Form(
      key: _stepKeys[0],
      child: PraxisCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PrototypeSectionHeader(
              title: 'Clinical wedge',
              subtitle: 'Use specialty and focus areas, never patient cases.',
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final specialty in const [
                  'Dermatology',
                  'ENT',
                  'Dental',
                  'Pediatrics',
                  'Gynecology',
                  'Physiotherapy',
                ])
                  FilterPill(
                    label: specialty,
                    active: _specialty.text == specialty,
                    onTap: () => setState(() => _specialty.text = specialty),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            _field(
              _specialty,
              'Specialty',
              const Key('specialtyField'),
              icon: Icons.medical_services_outlined,
              requiredMessage: 'Specialty is required',
            ),
            _field(
              _services,
              'Clinic services',
              const Key('servicesField'),
              icon: Icons.health_and_safety_outlined,
              requiredMessage: 'Clinic services are required',
              helper:
                  'Separate services with commas, e.g. sinus consultation, ear infection care.',
            ),
            const SizedBox(height: 8),
            const PreviewOnlyBanner(
              message:
                  'No patient names, reports, case histories, or identifiable details belong in generation prompts.',
              icon: Icons.privacy_tip_outlined,
            ),
          ],
        ),
      ),
    );
  }

  Widget _clinicStep() {
    return Form(
      key: _stepKeys[1],
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 760;
          final form = PraxisCard(
            child: Column(
              children: [
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
                  _phone,
                  'Phone or WhatsApp',
                  const Key('phoneField'),
                  icon: Icons.phone_outlined,
                ),
              ],
            ),
          );
          final preview = _ClinicPreviewCard(
            clinicName: _clinicName.text,
            locality: _locality.text,
            city: _city.text,
            phone: _phone.text,
          );
          if (!wide) {
            return Column(
              children: [form, const SizedBox(height: 16), preview],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 3, child: form),
              const SizedBox(width: 16),
              Expanded(flex: 2, child: preview),
            ],
          );
        },
      ),
    );
  }

  Widget _doctorStep() {
    return Form(
      key: _stepKeys[2],
      child: PraxisCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PrototypeSectionHeader(
              title: 'Doctor authority',
              subtitle: 'Shown on exports and campaign context.',
              trailing: StatusBadge(
                label: 'Approval required',
                icon: Icons.verified_user_outlined,
                color: const Color(0xFFF3F0FF),
                foreground: praxisPurple,
              ),
            ),
            const SizedBox(height: 16),
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
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: const [
                StatusBadge(label: 'Patient education'),
                StatusBadge(
                  label: 'No diagnosis advice',
                  color: Color(0xFFF3F0FF),
                  foreground: praxisPurple,
                ),
                StatusBadge(
                  label: 'Manual approval',
                  color: Color(0xFFFFF8E8),
                  foreground: Color(0xFF8A5E00),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _brandStep() {
    return Form(
      key: _stepKeys[3],
      child: PraxisCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PrototypeSectionHeader(
              title: 'Brand defaults',
              subtitle:
                  'These supported v0.2 fields apply to new content only.',
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final tone in const [
                  'warm',
                  'authoritative',
                  'simple',
                  'premium',
                ])
                  FilterPill(
                    label: tone,
                    active: _tone == tone,
                    onTap: () => setState(() => _tone = tone),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            _field(
              _primaryColor,
              'Primary color',
              const Key('primaryColorField'),
              icon: Icons.color_lens_outlined,
            ),
            _field(
              _cta,
              'Default CTA',
              const Key('ctaField'),
              icon: Icons.campaign_outlined,
            ),
            _field(
              _disclaimer,
              'Disclaimer',
              const Key('disclaimerField'),
              icon: Icons.policy_outlined,
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _goalsStep() {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PrototypeSectionHeader(
            title: 'Campaign intent',
            subtitle:
                'These choices guide the demo experience. Publishing remains disabled.',
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final goal in const [
                'Appointments',
                'Awareness',
                'Service education',
                'Local trust',
              ])
                FilterPill(
                  label: goal,
                  active: _goal == goal,
                  icon: Icons.track_changes_outlined,
                  onTap: () => setState(() => _goal = goal),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final platform in const [
                'Instagram',
                'WhatsApp',
                'Google Business',
                'Clinic posters',
              ])
                FilterPill(
                  label: platform,
                  active: _platforms.contains(platform),
                  icon: Icons.devices_outlined,
                  onTap: () => setState(() {
                    if (_platforms.contains(platform)) {
                      _platforms.remove(platform);
                    } else {
                      _platforms.add(platform);
                    }
                  }),
                ),
            ],
          ),
          const SizedBox(height: 18),
          const PreviewOnlyBanner(
            message:
                'Platform selection prepares exports only. No social publishing or WhatsApp automation is active in the MVP.',
          ),
        ],
      ),
    );
  }

  Widget _reviewStep() {
    final services = _services.text
        .split(',')
        .map((service) => service.trim())
        .where((service) => service.isNotEmpty)
        .toList();
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PrototypeSectionHeader(
            title: 'Review the workspace',
            subtitle:
                'PraxisLume will use this non-patient clinic context for new campaigns.',
          ),
          const SizedBox(height: 18),
          _reviewRow('Doctor', _doctorName.text),
          _reviewRow('Specialty', _specialty.text),
          _reviewRow('Clinic', _clinicName.text),
          _reviewRow('Location', '${_locality.text}, ${_city.text}'),
          _reviewRow('Services', services.join(', ')),
          _reviewRow('Tone', _tone),
          _reviewRow('CTA', _cta.text),
          const SizedBox(height: 14),
          const PreviewOnlyBanner(
            message:
                'Generated content stays in review/export mode until the doctor approves it.',
            icon: Icons.fact_check_outlined,
          ),
        ],
      ),
    );
  }

  Widget _completeStep() {
    return PraxisCard(
      color: praxisMint.withValues(alpha: 0.72),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_outline,
            color: praxisTealDark,
            size: 64,
          ),
          const SizedBox(height: 18),
          Text(
            'Ready to launch',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text(
            'Complete onboarding to open the dashboard, then generate a 30-day specialty-aware campaign.',
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: const [
              PlatformChip(label: 'Manual export', icon: Icons.copy),
              PlatformChip(
                label: 'Social publishing',
                icon: Icons.publish_outlined,
                enabled: false,
              ),
              PlatformChip(
                label: 'Avatar video',
                icon: Icons.video_call_outlined,
                enabled: false,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _reviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 116,
            child: Text(label, style: const TextStyle(color: praxisMuted)),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '-' : value,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  void _next() {
    if (_step <= 3 && !(_stepKeys[_step].currentState?.validate() ?? true)) {
      return;
    }
    setState(() => _step += 1);
  }

  Future<void> _submit() async {
    final services = _services.text
        .split(',')
        .map((service) => service.trim())
        .where((service) => service.isNotEmpty)
        .toList();
    final controller = ref.read(praxisProvider.notifier);
    await controller.completeOnboarding(
      doctorName: _doctorName.text.trim(),
      qualifications: _qualifications.text.trim(),
      specialty: _specialty.text.trim(),
      clinicName: _clinicName.text.trim(),
      locality: _locality.text.trim(),
      city: _city.text.trim(),
      services: services,
      phone: _phone.text.trim(),
    );
    await controller.updateBrandKit(
      primaryColor: _primaryColor.text.trim(),
      tone: _tone,
      defaultCta: _cta.text.trim(),
      disclaimer: _disclaimer.text.trim(),
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
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        key: key,
        controller: controller,
        maxLines: maxLines,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          prefixIcon: Icon(icon),
          alignLabelWithHint: maxLines > 1,
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

class _OnboardingStep {
  const _OnboardingStep({
    required this.title,
    required this.eyebrow,
    required this.icon,
  });

  final String title;
  final String eyebrow;
  final IconData icon;
}

class _OnboardingRail extends StatelessWidget {
  const _OnboardingRail({required this.currentStep, required this.steps});

  final int currentStep;
  final List<_OnboardingStep> steps;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      padding: const EdgeInsets.fromLTRB(28, 30, 20, 24),
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(right: BorderSide(color: praxisLine)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 58),
          Text(
            'Welcome to PraxisLume',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text('Set up your practice in seven focused steps.'),
          const SizedBox(height: 28),
          Expanded(
            child: ListView(
              children: [
                for (var i = 0; i < steps.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: i == currentStep
                              ? praxisPurple
                              : i < currentStep
                              ? praxisTeal
                              : praxisSurface,
                          foregroundColor: i <= currentStep
                              ? Colors.white
                              : praxisText,
                          child: i < currentStep
                              ? const Icon(Icons.check, size: 16)
                              : Text(
                                  '${i + 1}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          steps[i].icon,
                          color: i == currentStep ? praxisPurple : praxisMuted,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            steps[i].title,
                            style: TextStyle(
                              color: i == currentStep
                                  ? praxisPurple
                                  : praxisText,
                              fontWeight: i == currentStep
                                  ? FontWeight.w900
                                  : FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SecurityNotice(),
        ],
      ),
    );
  }
}

class _OnboardingPreview extends StatelessWidget {
  const _OnboardingPreview({
    required this.step,
    required this.clinicName,
    required this.specialty,
    required this.services,
    required this.primaryColor,
    required this.cta,
  });

  final int step;
  final String clinicName;
  final String specialty;
  final String services;
  final String primaryColor;
  final String cta;

  @override
  Widget build(BuildContext context) {
    final brandColor = parseBrandColor(primaryColor, fallback: praxisTealDark);
    return Column(
      children: [
        PraxisCard(
          color: praxisMint.withValues(alpha: 0.7),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PrototypeSectionHeader(
                title: 'Clinic campaign preview',
                subtitle: 'Deterministic preview, not a design canvas.',
                trailing: StatusBadge(label: 'v0.1 + v0.2'),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: brandColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: Colors.white,
                          foregroundColor: praxisTealDark,
                          child: Icon(Icons.local_hospital_outlined),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            clinicName.isEmpty ? 'Clinic name' : clinicName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 17,
                              letterSpacing: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 30),
                    Text(
                      specialty.isEmpty ? 'Specialty campaign' : specialty,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        height: 1.05,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      services.isEmpty
                          ? 'Focus areas will appear here'
                          : services,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                      ),
                    ),
                    const SizedBox(height: 22),
                    StatusBadge(
                      label: cta.isEmpty ? 'Book a consultation' : cta,
                      color: praxisGold,
                      foreground: praxisInk,
                      icon: Icons.campaign_outlined,
                    ),
                  ],
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
                _previewTitle(step),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(_previewText(step)),
            ],
          ),
        ),
      ],
    );
  }

  String _previewTitle(int step) {
    return switch (step) {
      0 => 'Specialty-aware from the start',
      1 => 'Local clinic context',
      2 => 'Doctor approval remains central',
      3 => 'Brand kit light',
      4 => 'Manual export workflow',
      5 => 'Safe review handoff',
      _ => 'Ready for campaign generation',
    };
  }

  String _previewText(int step) {
    return switch (step) {
      0 =>
        'Topics are guided by specialty and clinic services, not patient stories.',
      1 => 'Location and contact basics power practical CTAs.',
      2 =>
        'Generated content is educational and must be reviewed by the doctor.',
      3 => 'Colors, tone, CTA, and disclaimer feed new generated content.',
      4 => 'Platform chips prepare exports only. Nothing is auto-published.',
      5 => 'The MVP keeps every generated asset editable and copyable.',
      _ => 'Next stop: dashboard, then the 30-day review-ready campaign.',
    };
  }
}

class _ClinicPreviewCard extends StatelessWidget {
  const _ClinicPreviewCard({
    required this.clinicName,
    required this.locality,
    required this.city,
    required this.phone,
  });

  final String clinicName;
  final String locality;
  final String city;
  final String phone;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PrototypeSectionHeader(
            title: 'Live clinic card',
            subtitle: 'Only supported MVP fields persist.',
          ),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const CircleAvatar(
              backgroundColor: praxisMint,
              foregroundColor: praxisTealDark,
              child: Icon(Icons.local_hospital_outlined),
            ),
            title: Text(clinicName.isEmpty ? 'Clinic name' : clinicName),
            subtitle: Text(
              [
                    if (locality.isNotEmpty) locality,
                    if (city.isNotEmpty) city,
                  ].join(', ').isEmpty
                  ? 'Locality, city'
                  : [
                      if (locality.isNotEmpty) locality,
                      if (city.isNotEmpty) city,
                    ].join(', '),
            ),
          ),
          const Divider(height: 24),
          _info(Icons.phone_outlined, phone.isEmpty ? 'Phone/WhatsApp' : phone),
          _info(Icons.link_outlined, 'Appointment URL deferred'),
          _info(Icons.access_time_outlined, 'Clinic timings visual only'),
        ],
      ),
    );
  }

  Widget _info(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: praxisMuted, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
