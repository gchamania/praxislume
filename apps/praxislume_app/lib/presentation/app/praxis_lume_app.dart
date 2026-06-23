import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../router/praxis_router.dart';

class PraxisLumeApp extends StatelessWidget {
  const PraxisLumeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const ProviderScope(child: PraxisRouterApp());
  }
}
