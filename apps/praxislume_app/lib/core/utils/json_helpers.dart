List<Map<String, dynamic>> asRows(Object? value) {
  if (value is! List) {
    return const [];
  }
  return [
    for (final row in value)
      if (row is Map) Map<String, dynamic>.from(row),
  ];
}

Future<Map<String, dynamic>?> maybeSingle(dynamic query) async {
  final value = await query.maybeSingle();
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

String readText(Map<String, dynamic> row, String key) {
  final value = row[key];
  return value == null ? '' : value.toString();
}

int readInt(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is int) {
    return value;
  }
  return int.tryParse(readText(row, key)) ?? 0;
}

List<String> readStringList(Object? value) {
  if (value is! List) {
    return const [];
  }
  return [
    for (final item in value)
      if (item != null) item.toString(),
  ];
}

String? nullableText(Map<String, dynamic> row, String key) {
  final value = readText(row, key);
  return value.isEmpty ? null : value;
}
