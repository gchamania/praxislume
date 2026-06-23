import 'package:flutter/material.dart';

import '../../../ui/praxis_components.dart';

class PlaceholderFeatureScreen extends StatelessWidget {
  const PlaceholderFeatureScreen({
    required this.route,
    required this.title,
    required this.message,
    required this.icon,
    super.key,
  });

  final String route;
  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return WorkspaceShell(
      title: title,
      subtitle: 'Visual placeholder only. This area is intentionally deferred.',
      currentRoute: route,
      child: ComingSoonPanel(title: title, message: message, icon: icon),
    );
  }
}
