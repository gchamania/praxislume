import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../presentation/state/praxis_providers.dart';
import 'praxis_theme.dart';

class PraxisLogo extends StatelessWidget {
  const PraxisLogo({this.compact = false, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final mark = Container(
      width: compact ? 36 : 44,
      height: compact ? 36 : 44,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF8A42FF), Color(0xFF2DB6FF)],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: praxisPurple.withValues(alpha: 0.2),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          const Center(
            child: Text(
              'P',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
          ),
          Positioned(
            top: compact ? 8 : 10,
            right: compact ? 7 : 9,
            child: Container(
              width: compact ? 9 : 11,
              height: compact ? 9 : 11,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.86),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
    if (compact) {
      return mark;
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        const SizedBox(width: 12),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'PraxisLume',
                style: TextStyle(
                  color: praxisInk,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: 2),
              Text(
                'Grow Your Practice',
                style: TextStyle(
                  color: praxisMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class PraxisCard extends StatelessWidget {
  const PraxisCard({
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.color,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? praxisSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: praxisLine),
        boxShadow: [
          BoxShadow(
            color: praxisInk.withValues(alpha: 0.045),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PraxisChip extends StatelessWidget {
  const PraxisChip({
    required this.label,
    this.color = praxisMint,
    this.foreground = praxisTealDark,
    this.icon,
    super.key,
  });

  final String label;
  final Color color;
  final Color foreground;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: foreground),
            const SizedBox(width: 5),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: foreground,
                fontSize: 12,
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

class StatCard extends StatelessWidget {
  const StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.tint,
    this.delta,
    super.key,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color tint;
  final String? delta;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: tint.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: tint, size: 28),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(label),
                if (delta != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    delta!,
                    style: const TextStyle(
                      color: Color(0xFF009E73),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MedicalThumbnail extends StatelessWidget {
  const MedicalThumbnail({
    required this.title,
    required this.category,
    this.index = 0,
    this.aspectRatio = 1.75,
    super.key,
  });

  final String title;
  final String category;
  final int index;
  final double aspectRatio;

  static const _palettes = [
    [Color(0xFF07233D), Color(0xFF0E6B75)],
    [Color(0xFF0E7C75), Color(0xFFBCECE4)],
    [Color(0xFF1A2140), Color(0xFF6B5BFF)],
    [Color(0xFFFFF2E5), Color(0xFFF9A03F)],
    [Color(0xFFEAF6FF), Color(0xFF2E79FF)],
  ];

  @override
  Widget build(BuildContext context) {
    final palette = _palettes[index % _palettes.length];
    final light = index % 5 == 3 || index % 5 == 4;
    final textColor = light ? praxisInk : Colors.white;
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: palette,
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 0,
              right: 0,
              child: PraxisChip(
                label: compactCategoryLabel(category),
                color: Colors.white.withValues(alpha: light ? 0.9 : 0.22),
                foreground: textColor,
              ),
            ),
            Positioned(
              right: -12,
              bottom: -14,
              child: Icon(
                _iconForCategory(category),
                color: (light ? Colors.white : Colors.white).withValues(
                  alpha: light ? 0.52 : 0.2,
                ),
                size: 92,
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  _iconForCategory(category),
                  color: textColor.withValues(alpha: light ? 0.74 : 0.88),
                  size: 22,
                ),
                const Spacer(),
                Text(
                  title,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 24,
                    height: 1.02,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

IconData _iconForCategory(String category) {
  return switch (category) {
    'myth_buster' => Icons.balance,
    'symptoms' => Icons.healing,
    'procedure_explainer' => Icons.medical_services_outlined,
    'seasonal_health_tip' => Icons.eco_outlined,
    'clinic_service' => Icons.local_hospital_outlined,
    'faq' => Icons.help_outline,
    _ => Icons.health_and_safety_outlined,
  };
}

String categoryLabel(String category) => _categoryLabel(category);

String compactCategoryLabel(String category) {
  return switch (category) {
    'myth_buster' => 'Myth',
    'symptoms' => 'Reel',
    'procedure_explainer' => 'Carousel',
    'seasonal_health_tip' => 'Story',
    'clinic_service' => 'Post',
    'faq' => 'FAQ',
    _ => 'Post',
  };
}

String _categoryLabel(String category) {
  return switch (category) {
    'myth_buster' => 'Myth-buster',
    'symptoms' => 'Symptoms',
    'procedure_explainer' => 'Explainer',
    'seasonal_health_tip' => 'Tip',
    'clinic_service' => 'Service',
    'faq' => 'FAQ',
    _ => 'Awareness',
  };
}

class WorkspaceShell extends StatelessWidget {
  const WorkspaceShell({
    required this.title,
    required this.subtitle,
    required this.currentRoute,
    required this.child,
    this.primaryAction,
    super.key,
  });

  final String title;
  final String subtitle;
  final String currentRoute;
  final Widget child;
  final Widget? primaryAction;

  @override
  Widget build(BuildContext context) {
    final isCompact = MediaQuery.sizeOf(context).width < 700;
    final body = Column(
      children: [
        _TopBar(title: 'PraxisLume OS', primaryAction: primaryAction),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(
              isCompact ? 16 : 32,
              isCompact ? 18 : 24,
              isCompact ? 16 : 32,
              32,
            ),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 24),
                      child,
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (isCompact) {
      return Scaffold(
        drawer: _Sidebar(currentRoute: currentRoute),
        appBar: AppBar(
          title: const PraxisLogo(compact: true),
          backgroundColor: praxisSurface,
          surfaceTintColor: praxisSurface,
          elevation: 0,
        ),
        body: body,
      );
    }

    return Scaffold(
      body: Row(
        children: [
          _Sidebar(currentRoute: currentRoute),
          Expanded(child: body),
        ],
      ),
    );
  }
}

class _TopBar extends ConsumerWidget {
  const _TopBar({required this.title, this.primaryAction});

  final String title;
  final Widget? primaryAction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(praxisProvider);
    final doctorName = state.doctor?.name ?? 'Doctor';
    final specialty = state.doctor?.specialty ?? 'PraxisLume OS';
    return Container(
      height: 66,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(bottom: BorderSide(color: praxisLine)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final dense = constraints.maxWidth < 720;
          return Row(
            children: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.menu)),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const SizedBox(width: 14),
              if (primaryAction != null && !dense) ...[
                primaryAction!,
                const SizedBox(width: 18),
              ],
              if (!dense)
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.help_outline),
                ),
              Stack(
                alignment: Alignment.topRight,
                children: [
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.notifications_none),
                  ),
                  Positioned(
                    top: 9,
                    right: 9,
                    child: Container(
                      width: 9,
                      height: 9,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE03131),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              if (!dense) Container(width: 1, height: 28, color: praxisLine),
              if (!dense) const SizedBox(width: 14),
              if (!dense)
                Flexible(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        doctorName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: praxisInk,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0,
                        ),
                      ),
                      Text(
                        specialty,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: praxisMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0,
                        ),
                      ),
                    ],
                  ),
                ),
              if (!dense) const SizedBox(width: 10),
              const CircleAvatar(
                radius: 20,
                backgroundColor: praxisMint,
                child: Icon(Icons.person, color: praxisTealDark, size: 21),
              ),
              if (!dense)
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.keyboard_arrow_down),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Sidebar extends StatelessWidget {
  const _Sidebar({required this.currentRoute});

  final String currentRoute;

  @override
  Widget build(BuildContext context) {
    final showModeCard = MediaQuery.sizeOf(context).height >= 700;
    return Container(
      width: 260,
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(right: BorderSide(color: praxisLine)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 24, 18, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: PraxisLogo(),
              ),
              const SizedBox(height: 30),
              Expanded(
                child: ListView(
                  children: [
                    _NavItem(
                      route: '/dashboard',
                      label: 'Dashboard',
                      icon: Icons.dashboard_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/generate',
                      label: 'Generate Content',
                      icon: Icons.edit_note_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/library',
                      label: 'Content Library',
                      icon: Icons.grid_view_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/media-studio',
                      label: 'Media Studio',
                      icon: Icons.video_library_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/analytics',
                      label: 'Analytics',
                      icon: Icons.bar_chart_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/brand',
                      label: 'Brand',
                      icon: Icons.palette_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/calendar',
                      label: 'Calendar',
                      icon: Icons.calendar_month_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/templates',
                      label: 'Templates',
                      icon: Icons.dynamic_feed_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/settings',
                      label: 'Settings',
                      icon: Icons.settings_outlined,
                      currentRoute: currentRoute,
                    ),
                    const _DisabledNavItem(
                      label: 'Help & Support',
                      icon: Icons.help_outline,
                    ),
                  ],
                ),
              ),
              if (showModeCard)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [praxisPurple, praxisPurpleDark],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: praxisPurple.withValues(alpha: 0.22),
                        blurRadius: 22,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.workspace_premium, color: Colors.white),
                      const SizedBox(height: 12),
                      const Text(
                        'Go Pro',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Unlock advanced features and grow your practice faster.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.88),
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Upgrade Now',
                              style: TextStyle(
                                color: praxisPurple,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(
                              Icons.arrow_forward,
                              size: 16,
                              color: praxisPurple,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.route,
    required this.label,
    required this.icon,
    required this.currentRoute,
  });

  final String route;
  final String label;
  final IconData icon;
  final String currentRoute;

  @override
  Widget build(BuildContext context) {
    final active =
        currentRoute == route ||
        (route != '/dashboard' && currentRoute.startsWith(route));
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.go(route),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: active ? praxisSidebarActive : null,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: active ? praxisPurple : praxisText),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: active ? praxisPurple : praxisText,
                    fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                    letterSpacing: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DisabledNavItem extends StatelessWidget {
  const _DisabledNavItem({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: praxisText),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: praxisText,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ComingSoonPanel extends StatelessWidget {
  const ComingSoonPanel({
    required this.title,
    required this.message,
    required this.icon,
    super.key,
  });

  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: praxisPurple.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: praxisPurple, size: 32),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(message),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
