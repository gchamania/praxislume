import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = SupabaseSettings.fromEnvironment();
  if (settings.isConfigured) {
    await Supabase.initialize(
      url: settings.url,
      publishableKey: settings.anonKey,
    );
  }
  runApp(const PraxisLumeApp());
}

const _clinicalTeal = Color(0xFF0D4D57);
const _softMint = Color(0xFFA7E1D6);
const _warmWhite = Color(0xFFFAFAF6);
const _graphite = Color(0xFF1C1F23);
const _gold = Color(0xFFF2C15E);

class SupabaseSettings {
  const SupabaseSettings({required this.url, required this.anonKey});

  factory SupabaseSettings.fromEnvironment() {
    return const SupabaseSettings(
      url: String.fromEnvironment('SUPABASE_URL', defaultValue: ''),
      anonKey: String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: ''),
    );
  }

  final String url;
  final String anonKey;

  bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

class ClinicProfile {
  const ClinicProfile({
    required this.name,
    required this.locality,
    required this.city,
    required this.services,
    required this.phone,
  });

  final String name;
  final String locality;
  final String city;
  final List<String> services;
  final String phone;
}

class DoctorProfile {
  const DoctorProfile({
    required this.name,
    required this.qualifications,
    required this.specialty,
  });

  final String name;
  final String qualifications;
  final String specialty;
}

class BrandKit {
  const BrandKit({
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.tone,
    required this.defaultCta,
    required this.disclaimer,
    this.logoPath,
  });

  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String tone;
  final String defaultCta;
  final String disclaimer;
  final String? logoPath;

  BrandKit copyWith({
    String? primaryColor,
    String? secondaryColor,
    String? accentColor,
    String? tone,
    String? defaultCta,
    String? disclaimer,
    String? logoPath,
  }) {
    return BrandKit(
      primaryColor: primaryColor ?? this.primaryColor,
      secondaryColor: secondaryColor ?? this.secondaryColor,
      accentColor: accentColor ?? this.accentColor,
      tone: tone ?? this.tone,
      defaultCta: defaultCta ?? this.defaultCta,
      disclaimer: disclaimer ?? this.disclaimer,
      logoPath: logoPath ?? this.logoPath,
    );
  }
}

class ContentCampaign {
  const ContentCampaign({
    required this.id,
    required this.title,
    required this.goal,
    required this.durationDays,
    required this.startDate,
  });

  final String id;
  final String title;
  final String goal;
  final int durationDays;
  final DateTime startDate;
}

class ContentItem {
  const ContentItem({
    required this.id,
    required this.campaignId,
    required this.dayOffset,
    required this.title,
    required this.category,
    required this.status,
    required this.caption,
    required this.shortCta,
    required this.reelScript,
  });

  final String id;
  final String campaignId;
  final int dayOffset;
  final String title;
  final String category;
  final String status;
  final String caption;
  final String shortCta;
  final String reelScript;

  ContentItem copyWith({
    String? status,
    String? caption,
    String? shortCta,
    String? reelScript,
  }) {
    return ContentItem(
      id: id,
      campaignId: campaignId,
      dayOffset: dayOffset,
      title: title,
      category: category,
      status: status ?? this.status,
      caption: caption ?? this.caption,
      shortCta: shortCta ?? this.shortCta,
      reelScript: reelScript ?? this.reelScript,
    );
  }
}

class PraxisState {
  const PraxisState({
    required this.isAuthenticated,
    required this.brandKit,
    this.clinic,
    this.doctor,
    this.campaign,
    this.items = const [],
  });

  factory PraxisState.initial() {
    return const PraxisState(
      isAuthenticated: false,
      brandKit: BrandKit(
        primaryColor: '#0D4D57',
        secondaryColor: '#A7E1D6',
        accentColor: '#F2C15E',
        tone: 'warm',
        defaultCta: 'Book a consultation',
        disclaimer:
            'This content is for general education only. Please consult a qualified doctor for personal medical advice.',
      ),
    );
  }

  final bool isAuthenticated;
  final ClinicProfile? clinic;
  final DoctorProfile? doctor;
  final BrandKit brandKit;
  final ContentCampaign? campaign;
  final List<ContentItem> items;

  bool get onboardingComplete => clinic != null && doctor != null;

  PraxisState copyWith({
    bool? isAuthenticated,
    ClinicProfile? clinic,
    DoctorProfile? doctor,
    BrandKit? brandKit,
    ContentCampaign? campaign,
    List<ContentItem>? items,
  }) {
    return PraxisState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      clinic: clinic ?? this.clinic,
      doctor: doctor ?? this.doctor,
      brandKit: brandKit ?? this.brandKit,
      campaign: campaign ?? this.campaign,
      items: items ?? this.items,
    );
  }
}

class PraxisController extends StateNotifier<PraxisState> {
  PraxisController() : super(PraxisState.initial());

  void signInDemo() {
    state = state.copyWith(isAuthenticated: true);
  }

  void signOut() {
    state = PraxisState.initial();
  }

  void completeOnboarding({
    required String doctorName,
    required String qualifications,
    required String clinicName,
    required String locality,
    required String city,
    required List<String> services,
    required String phone,
    String specialty = 'Dermatology',
  }) {
    final doctor = DoctorProfile(
      name: doctorName,
      qualifications: qualifications,
      specialty: specialty,
    );
    final clinic = ClinicProfile(
      name: clinicName,
      locality: locality,
      city: city,
      services: services,
      phone: phone,
    );
    state = state.copyWith(
      isAuthenticated: true,
      doctor: doctor,
      clinic: clinic,
      brandKit: state.brandKit.copyWith(defaultCta: state.brandKit.defaultCta),
    );
  }

  void generateThirtyDayCampaign() {
    final clinic = state.clinic;
    final doctor = state.doctor;
    if (clinic == null || doctor == null) {
      return;
    }

    const categories = [
      'awareness',
      'myth_buster',
      'symptoms',
      'procedure_explainer',
      'seasonal_health_tip',
      'clinic_service',
      'faq',
    ];
    const categoryLabels = {
      'awareness': 'Awareness',
      'myth_buster': 'Myth-buster',
      'symptoms': 'Symptoms',
      'procedure_explainer': 'Procedure explainer',
      'seasonal_health_tip': 'Seasonal health tip',
      'clinic_service': 'Clinic service',
      'faq': 'FAQ',
    };
    final campaign = ContentCampaign(
      id: 'campaign-30-day',
      title: '30-day Dermatology Growth Campaign',
      goal: 'increase appointment enquiries',
      durationDays: 30,
      startDate: DateTime(2026, 6, 22),
    );
    final items = List.generate(30, (index) {
      final category = categories[index % categories.length];
      final service = clinic.services[index % clinic.services.length];
      final label = categoryLabels[category]!;
      return ContentItem(
        id: 'item-${index + 1}',
        campaignId: campaign.id,
        dayOffset: index,
        title: 'Day ${index + 1}: $label for $service',
        category: category,
        status: 'drafted',
        caption:
            'A patient-friendly $label post about $service for ${clinic.locality}. This is general education and should be reviewed by ${doctor.name}.',
        shortCta: state.brandKit.defaultCta,
        reelScript:
            'Open with a common concern, explain one safe care tip, and close with ${state.brandKit.defaultCta}.',
      );
    });

    state = state.copyWith(campaign: campaign, items: items);
  }

  void updateContentItem(String id, {required String caption}) {
    state = state.copyWith(
      items: [
        for (final item in state.items)
          if (item.id == id)
            item.copyWith(caption: caption, status: 'drafted')
          else
            item,
      ],
    );
  }

  void updateBrandKit({
    required String primaryColor,
    required String defaultCta,
  }) {
    state = state.copyWith(
      brandKit: state.brandKit.copyWith(
        primaryColor: primaryColor,
        defaultCta: defaultCta,
      ),
    );
  }
}

final praxisProvider = StateNotifierProvider<PraxisController, PraxisState>((
  ref,
) {
  return PraxisController();
});

class PraxisLumeApp extends StatelessWidget {
  const PraxisLumeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const ProviderScope(child: _PraxisRouterApp());
  }
}

class _PraxisRouterApp extends StatefulWidget {
  const _PraxisRouterApp();

  @override
  State<_PraxisRouterApp> createState() => _PraxisRouterAppState();
}

class _PraxisRouterAppState extends State<_PraxisRouterApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/sign-in',
      routes: [
        GoRoute(
          path: '/sign-in',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/calendar',
          builder: (context, state) => const CalendarScreen(),
        ),
        GoRoute(
          path: '/brand',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/content/:id',
          builder: (context, state) =>
              ContentDetailScreen(itemId: state.pathParameters['id']!),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'PraxisLume',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: _clinicalTeal,
          primary: _clinicalTeal,
          secondary: _softMint,
          surface: _warmWhite,
        ),
        scaffoldBackgroundColor: _warmWhite,
        useMaterial3: true,
        cardTheme: const CardThemeData(
          margin: EdgeInsets.symmetric(vertical: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
            side: BorderSide(color: Color(0x1F1C1F23)),
          ),
        ),
      ),
      routerConfig: _router,
    );
  }
}

class SignInScreen extends ConsumerWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'PraxisLume',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: _clinicalTeal,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Sign in to continue'),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () {
                    ref.read(praxisProvider.notifier).signInDemo();
                    context.go('/onboarding');
                  },
                  child: const Text('Use demo account'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(onPressed: () {}, child: const Text('Sign in')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _doctorName = TextEditingController();
  final _qualifications = TextEditingController();
  final _clinicName = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController();
  final _services = TextEditingController();
  final _phone = TextEditingController();

  @override
  void dispose() {
    _doctorName.dispose();
    _qualifications.dispose();
    _clinicName.dispose();
    _locality.dispose();
    _city.dispose();
    _services.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clinic onboarding')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _submit,
            child: const Text('Complete onboarding'),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Doctor and clinic profile',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          Form(
            key: _formKey,
            child: Column(
              children: [
                _field(
                  _doctorName,
                  'Doctor name',
                  const Key('doctorNameField'),
                  requiredMessage: 'Doctor name is required',
                ),
                _field(
                  _qualifications,
                  'Qualifications',
                  const Key('qualificationsField'),
                ),
                _field(
                  _clinicName,
                  'Clinic name',
                  const Key('clinicNameField'),
                ),
                _field(_locality, 'Locality', const Key('localityField')),
                _field(_city, 'City', const Key('cityField')),
                _field(
                  _services,
                  'Clinic services',
                  const Key('servicesField'),
                ),
                _field(_phone, 'Phone or WhatsApp', const Key('phoneField')),
                const SizedBox(height: 72),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    ref
        .read(praxisProvider.notifier)
        .completeOnboarding(
          doctorName: _doctorName.text.trim(),
          qualifications: _qualifications.text.trim(),
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
    context.go('/dashboard');
  }

  Widget _field(
    TextEditingController controller,
    String label,
    Key key, {
    String? requiredMessage,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        key: key,
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
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

class _AppScaffold extends StatelessWidget {
  const _AppScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          TextButton(
            onPressed: () => context.go('/dashboard'),
            child: const Text('Home'),
          ),
          TextButton(
            onPressed: () => context.go('/calendar'),
            child: const Text('Calendar'),
          ),
          TextButton(
            onPressed: () => context.go('/brand'),
            child: const Text('Brand'),
          ),
          TextButton(
            onPressed: () => context.go('/settings'),
            child: const Text('Settings'),
          ),
        ],
      ),
      body: ListView(padding: const EdgeInsets.all(24), children: [child]),
    );
  }
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'PraxisLume',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dashboard', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(state.clinic?.name ?? 'No clinic'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Campaign readiness'),
                  Text('Content ideas: ${state.items.length}'),
                  Text('Brand tone: ${state.brandKit.tone}'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'Content calendar',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Content calendar',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () =>
                ref.read(praxisProvider.notifier).generateThirtyDayCampaign(),
            child: const Text('Generate 30-day campaign'),
          ),
          if (state.campaign != null) ...[
            const SizedBox(height: 16),
            Text(
              state.campaign!.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text('Content ideas: ${state.items.length}'),
            const SizedBox(height: 8),
            for (final item in state.items.take(9))
              Card(
                child: ListTile(
                  title: Text(item.title),
                  subtitle: Text('${item.category} - ${item.status}'),
                  onTap: () => context.go('/content/${item.id}'),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class ContentDetailScreen extends ConsumerStatefulWidget {
  const ContentDetailScreen({required this.itemId, super.key});

  final String itemId;

  @override
  ConsumerState<ContentDetailScreen> createState() =>
      _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  late final TextEditingController _caption;
  bool _postPackageCopied = false;

  @override
  void initState() {
    super.initState();
    final item = ref
        .read(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    _caption = TextEditingController(text: item.caption);
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = ref
        .watch(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    return _AppScaffold(
      title: item.title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          TextField(
            key: const Key('captionField'),
            controller: _caption,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Caption',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              FilledButton(
                onPressed: () {
                  ref
                      .read(praxisProvider.notifier)
                      .updateContentItem(item.id, caption: _caption.text);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Content item saved')),
                  );
                },
                child: const Text('Save item'),
              ),
              OutlinedButton(
                onPressed: () {
                  final updated = ref
                      .read(praxisProvider)
                      .items
                      .firstWhere((candidate) => candidate.id == widget.itemId);
                  final package =
                      'Title: ${updated.title}\nCaption: ${updated.caption}\nCTA: ${updated.shortCta}\nReel script: ${updated.reelScript}';
                  Clipboard.setData(ClipboardData(text: package));
                  setState(() => _postPackageCopied = true);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Post package copied')),
                  );
                },
                child: const Text('Copy post package'),
              ),
            ],
          ),
          if (_postPackageCopied) ...[
            const SizedBox(height: 12),
            const Text('Post package copied'),
          ],
        ],
      ),
    );
  }
}

class BrandKitScreen extends ConsumerStatefulWidget {
  const BrandKitScreen({super.key});

  @override
  ConsumerState<BrandKitScreen> createState() => _BrandKitScreenState();
}

class _BrandKitScreenState extends ConsumerState<BrandKitScreen> {
  late final TextEditingController _primaryColor;
  late final TextEditingController _cta;

  @override
  void initState() {
    super.initState();
    final brand = ref.read(praxisProvider).brandKit;
    _primaryColor = TextEditingController(text: brand.primaryColor);
    _cta = TextEditingController(text: brand.defaultCta);
  }

  @override
  void dispose() {
    _primaryColor.dispose();
    _cta.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    return _AppScaffold(
      title: 'Brand kit',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Brand kit', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 16),
          TextField(
            key: const Key('primaryColorField'),
            controller: _primaryColor,
            decoration: const InputDecoration(
              labelText: 'Primary color',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('ctaField'),
            controller: _cta,
            decoration: const InputDecoration(
              labelText: 'Default CTA',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () {
              ref
                  .read(praxisProvider.notifier)
                  .updateBrandKit(
                    primaryColor: _primaryColor.text.trim(),
                    defaultCta: _cta.text.trim(),
                  );
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(const SnackBar(content: Text('Brand kit saved')));
            },
            child: const Text('Save brand kit'),
          ),
          const SizedBox(height: 16),
          BrandPreview(state: state),
        ],
      ),
    );
  }
}

class BrandPreview extends StatelessWidget {
  const BrandPreview({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: _softMint.withValues(alpha: 0.28),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              state.clinic?.name ?? 'Clinic name',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(color: _clinicalTeal),
            ),
            const SizedBox(height: 8),
            Text(state.doctor?.name ?? 'Doctor name'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _gold,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                state.brandKit.defaultCta,
                style: const TextStyle(
                  color: _graphite,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              state.brandKit.disclaimer,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _AppScaffold(
      title: 'Settings',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Settings', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {
              ref.read(praxisProvider.notifier).signOut();
              context.go('/sign-in');
            },
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}
