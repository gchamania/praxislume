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

class ApiSettings {
  const ApiSettings({required this.baseUrl});

  factory ApiSettings.fromEnvironment() {
    return const ApiSettings(
      baseUrl: String.fromEnvironment('API_BASE_URL', defaultValue: ''),
    );
  }

  final String baseUrl;

  bool get isConfigured => baseUrl.isNotEmpty;
}
