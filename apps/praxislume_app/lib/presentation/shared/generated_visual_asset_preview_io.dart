import 'package:flutter/material.dart';

import '../../domain/entities/praxis_models.dart';

class GeneratedVisualAssetPreview extends StatelessWidget {
  const GeneratedVisualAssetPreview({required this.asset, super.key});

  final GeneratedVisualAsset asset;

  @override
  Widget build(BuildContext context) {
    if (asset.mimeType == 'image/svg+xml') {
      return const GeneratedAssetPreviewError();
    }

    return Image.network(
      asset.signedUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) =>
          const GeneratedAssetPreviewError(),
    );
  }
}

class GeneratedAssetPreviewError extends StatelessWidget {
  const GeneratedAssetPreviewError({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(color: colorScheme.errorContainer),
      child: Center(
        child: Icon(
          Icons.broken_image_outlined,
          color: colorScheme.onErrorContainer,
          size: 42,
        ),
      ),
    );
  }
}
