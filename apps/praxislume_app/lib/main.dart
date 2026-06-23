import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/environment_settings.dart';
import 'presentation/app/praxis_lume_app.dart';

export 'praxis_lume.dart';

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
