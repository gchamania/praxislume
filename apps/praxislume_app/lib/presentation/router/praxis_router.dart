import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/auth/sign_in_screen.dart';
import '../screens/auth/sign_up_screen.dart';
import '../screens/brand/brand_kit_screen.dart';
import '../screens/calendar/calendar_screen.dart';
import '../screens/content/content_detail_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/generate/generate_content_screen.dart';
import '../screens/library/content_library_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/placeholders/placeholder_feature_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../../ui/praxis_theme.dart';

class PraxisRouterApp extends StatefulWidget {
  const PraxisRouterApp({super.key});

  @override
  State<PraxisRouterApp> createState() => _PraxisRouterAppState();
}

class _PraxisRouterAppState extends State<PraxisRouterApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/signin',
      routes: [
        GoRoute(
          path: '/signin',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/sign-in',
          builder: (context, state) => const SignInScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignUpScreen(),
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
          path: '/generate',
          builder: (context, state) => const GenerateContentScreen(),
        ),
        GoRoute(
          path: '/calendar',
          builder: (context, state) => const CalendarScreen(),
        ),
        GoRoute(
          path: '/library',
          builder: (context, state) => const ContentLibraryScreen(),
        ),
        GoRoute(
          path: '/brand',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/brand-settings',
          builder: (context, state) => const BrandKitScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/templates',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/templates',
            title: 'Templates',
            message: 'Templates are planned after MVP validation.',
            icon: Icons.dynamic_feed_outlined,
          ),
        ),
        GoRoute(
          path: '/analytics',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/analytics',
            title: 'Analytics',
            message: 'Analytics arrive after pilot usage data exists.',
            icon: Icons.bar_chart_outlined,
          ),
        ),
        GoRoute(
          path: '/media-studio',
          builder: (context, state) => const PlaceholderFeatureScreen(
            route: '/media-studio',
            title: 'Media Studio',
            message: 'Media Studio is outside the MVP.',
            icon: Icons.video_library_outlined,
          ),
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
      debugShowCheckedModeBanner: false,
      theme: buildPraxisTheme(),
      routerConfig: _router,
    );
  }
}
