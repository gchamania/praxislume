import '../../domain/entities/praxis_models.dart';

class GeneratedAssetDownloadResult {
  const GeneratedAssetDownloadResult({
    required this.downloaded,
    required this.openedInBrowser,
    required this.unsupported,
  });

  final bool downloaded;
  final bool openedInBrowser;
  final bool unsupported;
}

class GeneratedAssetDownloader {
  const GeneratedAssetDownloader();

  Future<GeneratedAssetDownloadResult> download(
    GeneratedVisualAsset asset, {
    required String filename,
  }) async {
    return const GeneratedAssetDownloadResult(
      downloaded: false,
      openedInBrowser: false,
      unsupported: true,
    );
  }
}
