import 'dart:math';

import 'package:flutter/material.dart';

import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';

class AuthSplitScaffold extends StatelessWidget {
  const AuthSplitScaffold({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1220),
                child: Container(
                  height: max(0, constraints.maxHeight - 40),
                  margin: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: praxisSurface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: praxisLine),
                    boxShadow: [
                      BoxShadow(
                        color: praxisInk.withValues(alpha: 0.08),
                        blurRadius: 30,
                        offset: const Offset(0, 18),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: wide
                      ? Row(
                          children: [
                            Expanded(
                              child: SingleChildScrollView(
                                padding: const EdgeInsets.all(64),
                                child: child,
                              ),
                            ),
                            const Expanded(child: AuthHeroPanel()),
                          ],
                        )
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(28),
                          child: child,
                        ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class AuthHeroPanel extends StatelessWidget {
  const AuthHeroPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(56),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF06363C), Color(0xFF005A60)],
        ),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Doctor Growth OS.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 34,
                height: 1.15,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              '30 days of branded medical content in 30 minutes.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                height: 1.35,
                fontWeight: FontWeight.w700,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 44),
            PraxisCard(
              color: Colors.white.withValues(alpha: 0.95),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      PraxisLogo(compact: true),
                      SizedBox(width: 10),
                      Text(
                        'Content Calendar',
                        style: TextStyle(
                          color: praxisInk,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: List.generate(
                      5,
                      (index) => Expanded(
                        child: Container(
                          height: 58,
                          margin: EdgeInsets.only(right: index == 4 ? 0 : 8),
                          decoration: BoxDecoration(
                            color: [
                              praxisPurple,
                              praxisMint,
                              praxisTeal,
                              praxisLine,
                              praxisGold,
                            ][index].withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 120,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(
                        8,
                        (index) => Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 34 + (index * 9 % 74).toDouble(),
                            decoration: BoxDecoration(
                              color: index.isEven
                                  ? praxisPurple.withValues(alpha: 0.32)
                                  : praxisTeal.withValues(alpha: 0.28),
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),
            Row(
              children: const [
                Expanded(
                  child: _HeroStat(value: '30', label: 'days planned'),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _HeroStat(value: '7', label: 'safe categories'),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _HeroStat(value: '0', label: 'publishing APIs'),
                ),
              ],
            ),
            const SizedBox(height: 30),
            PraxisCard(
              color: Colors.white.withValues(alpha: 0.12),
              child: Text(
                '"PraxisLume makes clinic education feel planned, branded, and reviewable before anything leaves the practice."',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.92),
                  height: 1.42,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 28),
            const _HeroBenefit(
              icon: Icons.schedule,
              title: 'Save 10+ hours every week',
              text: 'AI-assisted content planning tailored for your clinic.',
            ),
            const _HeroBenefit(
              icon: Icons.verified_user_outlined,
              title: 'Build trust and authority',
              text: 'Consistent, accurate and professional content.',
            ),
            const _HeroBenefit(
              icon: Icons.trending_up,
              title: 'Grow your patient base',
              text: 'Educational content that supports patient acquisition.',
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.78),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroBenefit extends StatelessWidget {
  const _HeroBenefit({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: praxisTeal.withValues(alpha: 0.8),
            foregroundColor: Colors.white,
            child: Icon(icon),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SocialAuthPlaceholders extends StatelessWidget {
  const SocialAuthPlaceholders({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Text(
            'or continue with email',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
        const SizedBox(height: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.g_mobiledata),
              label: const Text('Continue with Google'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.apple),
              label: const Text('Continue with Apple'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Social sign-in is a visual placeholder until enabled for pilot auth.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class SecurityNotice extends StatelessWidget {
  const SecurityNotice({super.key});

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      color: praxisMint,
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: praxisTealDark),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              'Your data is safe with us. Never enter patient-identifiable data into generation prompts.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: praxisText,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
