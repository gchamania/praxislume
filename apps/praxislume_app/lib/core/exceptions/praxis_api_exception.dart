class PraxisApiException implements Exception {
  const PraxisApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
