import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'praxis_theme.dart';

class PraxisLogo extends StatelessWidget {
  const PraxisLogo({this.compact = false, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final mark = Container(
      width: compact ? 38 : 46,
      height: compact ? 38 : 46,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF8249FF), Color(0xFF2DB6FF)],
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Center(
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
                  fontSize: 25,
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
                  color: praxisText,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
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
            color: praxisInk.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
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
        borderRadius: BorderRadius.circular(7),
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
              borderRadius: BorderRadius.circular(8),
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

class PrototypeSectionHeader extends StatelessWidget {
  const PrototypeSectionHeader({
    required this.title,
    this.subtitle,
    this.trailing,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final titleBlock = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    );
    if (trailing == null) {
      return titleBlock;
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 520) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [titleBlock, const SizedBox(height: 12), trailing!],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: titleBlock),
            const SizedBox(width: 12),
            trailing!,
          ],
        );
      },
    );
  }
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({
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
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: foreground.withValues(alpha: 0.14)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
      ),
    );
  }
}

class PrototypeTabStrip extends StatelessWidget {
  const PrototypeTabStrip({
    required this.tabs,
    required this.selected,
    required this.onSelected,
    super.key,
  });

  final List<String> tabs;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final tab in tabs)
          ChoiceChip(
            label: Text(tab),
            selected: tab == selected,
            onSelected: (_) => onSelected(tab),
            showCheckmark: false,
            selectedColor: praxisPurple.withValues(alpha: 0.1),
            labelStyle: TextStyle(
              color: tab == selected ? praxisPurple : praxisText,
              fontWeight: FontWeight.w800,
              letterSpacing: 0,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: BorderSide(
                color: tab == selected
                    ? praxisPurple.withValues(alpha: 0.28)
                    : praxisLine,
              ),
            ),
          ),
      ],
    );
  }
}

class FilterPill extends StatelessWidget {
  const FilterPill({
    required this.label,
    this.active = false,
    this.icon,
    this.onTap,
    super.key,
  });

  final String label;
  final bool active;
  final IconData? icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: active ? praxisPurple.withValues(alpha: 0.1) : praxisSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: active ? praxisPurple.withValues(alpha: 0.32) : praxisLine,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: active ? praxisPurple : praxisMuted),
              const SizedBox(width: 6),
            ],
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: active ? praxisPurple : praxisText,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
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

class PlatformChip extends StatelessWidget {
  const PlatformChip({
    required this.label,
    required this.icon,
    this.enabled = true,
    super.key,
  });

  final String label;
  final IconData icon;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      label: enabled ? label : '$label deferred',
      icon: icon,
      color: enabled ? const Color(0xFFF3F0FF) : const Color(0xFFF3F5F9),
      foreground: enabled ? praxisPurple : praxisMuted,
    );
  }
}

class MiniBarChart extends StatelessWidget {
  const MiniBarChart({
    required this.values,
    this.height = 116,
    this.primary = praxisPurple,
    this.secondary = praxisTeal,
    super.key,
  });

  final List<double> values;
  final double height;
  final Color primary;
  final Color secondary;

  @override
  Widget build(BuildContext context) {
    final maxValue = values.fold<double>(1, (max, value) {
      return value > max ? value : max;
    });
    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < values.length; i++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: FractionallySizedBox(
                  heightFactor: (values[i] / maxValue).clamp(0.14, 1),
                  alignment: Alignment.bottomCenter,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: (i.isEven ? primary : secondary).withValues(
                        alpha: 0.24 + (i % 3) * 0.08,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class PreviewOnlyBanner extends StatelessWidget {
  const PreviewOnlyBanner({
    this.message = 'Preview only / deferred after MVP validation',
    this.icon = Icons.lock_clock_outlined,
    super.key,
  });

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      color: const Color(0xFFFFF8E8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF9B6500)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF6F4A00),
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

class PrototypeMetricCard extends StatelessWidget {
  const PrototypeMetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.tint,
    this.note,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color tint;
  final String? note;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: tint.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: tint, size: 20),
              ),
              const Spacer(),
              if (note != null)
                Text(
                  note!,
                  style: const TextStyle(
                    color: praxisTealDark,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Text(value, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact =
              constraints.maxHeight < 96 || constraints.maxWidth < 130;
          return Container(
            padding: EdgeInsets.all(compact ? 8 : 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: palette,
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(8),
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -12,
                  bottom: -14,
                  child: Icon(
                    _iconForCategory(category),
                    color: (light ? Colors.white : Colors.white).withValues(
                      alpha: light ? 0.52 : 0.2,
                    ),
                    size: compact ? 44 : 92,
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!compact)
                      PraxisChip(
                        label: _categoryLabel(category),
                        color: Colors.white.withValues(
                          alpha: light ? 0.78 : 0.18,
                        ),
                        foreground: textColor,
                      ),
                    const Spacer(),
                    Text(
                      title,
                      maxLines: compact ? 2 : 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: textColor,
                        fontSize: compact ? 13 : 24,
                        height: 1.05,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
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
        _TopBar(title: title, primaryAction: primaryAction),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(
              isCompact ? 16 : 28,
              18,
              isCompact ? 16 : 28,
              28,
            ),
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 6),
              Text(subtitle, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 22),
              child,
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

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, this.primaryAction});

  final String title;
  final Widget? primaryAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 66,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: const BoxDecoration(
        color: praxisSurface,
        border: Border(bottom: BorderSide(color: praxisLine)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final showPrimary =
              primaryAction != null && constraints.maxWidth >= 760;
          final showExtras = constraints.maxWidth >= 1000;
          return Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: praxisPurple.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.local_hospital_outlined,
                  color: praxisPurple,
                  size: 19,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const SizedBox(width: 14),
              if (showPrimary) ...[primaryAction!, const SizedBox(width: 18)],
              if (showExtras) ...[
                SizedBox(
                  width: 250,
                  child: TextField(
                    readOnly: true,
                    decoration: InputDecoration(
                      hintText: 'Search campaigns',
                      prefixIcon: const Icon(Icons.search),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      fillColor: praxisCanvas,
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: praxisLine),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton(
                  tooltip: 'Help',
                  onPressed: () {},
                  icon: const Icon(Icons.help_outline),
                ),
              ],
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
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: praxisCanvas,
                  border: Border.all(color: praxisLine),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    CircleAvatar(
                      radius: 15,
                      backgroundColor: praxisMint,
                      child: Icon(
                        Icons.person,
                        color: praxisTealDark,
                        size: 17,
                      ),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Clinic Admin',
                      style: TextStyle(
                        color: praxisText,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0,
                      ),
                    ),
                  ],
                ),
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
          padding: const EdgeInsets.fromLTRB(14, 22, 14, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: PraxisLogo(),
              ),
              const SizedBox(height: 28),
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
                      icon: Icons.auto_fix_high_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/calendar',
                      label: 'Calendar',
                      icon: Icons.calendar_month_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/library',
                      label: 'Content Library',
                      icon: Icons.grid_view_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/carousels',
                      label: 'Carousels',
                      icon: Icons.view_carousel_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/brand',
                      label: 'Brand',
                      icon: Icons.palette_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/settings',
                      label: 'Settings',
                      icon: Icons.settings_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/templates',
                      label: 'Templates',
                      icon: Icons.dynamic_feed_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/analytics',
                      label: 'Analytics',
                      icon: Icons.bar_chart_outlined,
                      currentRoute: currentRoute,
                    ),
                    _NavItem(
                      route: '/media-studio',
                      label: 'Media Studio',
                      icon: Icons.video_library_outlined,
                      currentRoute: currentRoute,
                    ),
                  ],
                ),
              ),
              if (showModeCard)
                PraxisCard(
                  color: praxisPurple,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.workspace_premium, color: Colors.white),
                      const SizedBox(height: 10),
                      const Text(
                        'MVP Mode',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Future media, analytics, and publishing features are deferred.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.86),
                          fontSize: 12,
                          height: 1.35,
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
            color: active ? praxisPurple.withValues(alpha: 0.1) : null,
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
