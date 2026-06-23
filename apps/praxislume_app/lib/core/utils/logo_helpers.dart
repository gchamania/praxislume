String normalizeLogoExtension(String extension) {
  final normalized = extension.toLowerCase().replaceAll('.', '').trim();
  if (normalized == 'jpeg') {
    return 'jpg';
  }
  const allowed = {'png', 'jpg', 'webp', 'svg'};
  return allowed.contains(normalized) ? normalized : 'png';
}

String logoContentType(String extension) {
  switch (normalizeLogoExtension(extension)) {
    case 'jpg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}
