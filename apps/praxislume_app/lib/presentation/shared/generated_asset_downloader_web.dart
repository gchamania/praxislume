// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;

import '../../domain/entities/praxis_models.dart';
import 'generated_asset_downloader_io.dart';

class GeneratedAssetDownloader {
  const GeneratedAssetDownloader();

  Future<GeneratedAssetDownloadResult> download(
    GeneratedVisualAsset asset, {
    required String filename,
  }) async {
    try {
      final request = await html.HttpRequest.request(
        asset.signedUrl,
        responseType: 'blob',
      );
      final response = request.response;
      if (response is! html.Blob) {
        return _openInBrowser(asset);
      }

      final objectUrl = html.Url.createObjectUrlFromBlob(response);
      final anchor = html.AnchorElement(href: objectUrl)
        ..download = filename
        ..style.display = 'none';
      html.document.body?.append(anchor);
      anchor.click();
      anchor.remove();
      html.Url.revokeObjectUrl(objectUrl);
      return const GeneratedAssetDownloadResult(
        downloaded: true,
        openedInBrowser: false,
        unsupported: false,
      );
    } catch (_) {
      return _openInBrowser(asset);
    }
  }

  GeneratedAssetDownloadResult _openInBrowser(GeneratedVisualAsset asset) {
    html.window.open(asset.signedUrl, '_blank');
    return const GeneratedAssetDownloadResult(
      downloaded: false,
      openedInBrowser: true,
      unsupported: false,
    );
  }
}
