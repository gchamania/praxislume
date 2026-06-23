import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('main.dart stays bootstrap-only and architecture folders exist', () {
    final lib = Directory('lib');
    final mainFile = File('lib/main.dart');
    final mainSource = mainFile.readAsStringSync();
    final mainLines = mainSource
        .split('\n')
        .where((line) => line.trim().isNotEmpty)
        .length;

    expect(lib.existsSync(), isTrue);
    for (final folder in const [
      'core',
      'domain',
      'application',
      'data',
      'presentation',
      'ui',
    ]) {
      expect(
        Directory('lib/$folder').existsSync(),
        isTrue,
        reason: 'Expected lib/$folder to exist as an architecture layer.',
      );
    }

    expect(
      mainLines,
      lessThanOrEqualTo(40),
      reason: 'main.dart should only initialize Supabase and run the app.',
    );
    expect(mainSource, isNot(contains(RegExp(r'^class \w+', multiLine: true))));
    expect(mainSource, isNot(contains('GoRouter(')));
    expect(mainSource, isNot(contains('StateNotifierProvider')));
    expect(mainSource, isNot(contains('SupabasePraxisRepository')));
    expect(mainSource, isNot(contains('SignInScreen')));
  });
}
